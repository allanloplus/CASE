"""產生 Allan 顧問與阿拉蕾的角色語音（edge-tts，沿用 ISO 27001 系列課程的聲音，不可更換）。

配音範圍：動畫閱讀的所有對話、討論題的阿拉蕾提示、72 小時決策模擬的情境與 Allan 講評、
法條連連看的 Allan 解說，以及 EXTRA_LINES 的固定台詞。網站依「角色|台詞文字」找語音，
台詞改了而沒重新產生時，該句不會播放（不會播錯）。

用法：
  pip install edge-tts
  python3 tools/build_voice.py            # 所有已完成（status: 'ready'）的個案
  python3 tools/build_voice.py S115001    # 指定個案

輸出：cases/<案號>/voice/*.mp3 與 cases/<案號>/voice/voice.js（台詞對應的音檔清單）
檔名依「聲音設定＋唸法」雜湊，只有改過的台詞會重新合成；不再使用的音檔會刪除。
讀取 case.js 需要 node。
"""
import asyncio
import hashlib
import json
import os
import re
import ssl
import subprocess
import sys
from pathlib import Path

import edge_tts
import edge_tts.communicate as _comm

ROOT = Path(__file__).resolve().parent.parent

# 與 ISO 27001 系列課程相同：Allan 台灣男聲、阿拉蕾台灣女聲（語調調高）
VOICES = {
    'allan': dict(voice='zh-TW-YunJheNeural', rate='+6%', pitch='+0Hz'),
    'arale': dict(voice='zh-TW-HsiaoYuNeural', rate='+12%', pitch='+28Hz'),
}

# 閱讀完成時阿拉蕾的固定台詞（assets/js/reader.js 的 finish()）
EXTRA_LINES = [('arale', '辛苦了！討論區見，阿拉蕾幫你準備好遊戲了！')]

# 英文縮寫與編號的唸法
SPOKEN = [
    (r'ISO 27001', 'ISO 兩七零零一'),
    (r'ISO 27701', 'ISO 兩七七零一'),
    (r'TWCERT/CC', 'TW CERT CC'),
    (r'PHP2Shell', 'PHP to Shell'),
    (r'\bPDCA\b', 'P D C A'),
    (r'\bTISAX\b', 'TI SAX'),
    (r'\bDLP\b', 'D L P'),
    (r'\bCMDB\b', 'C M D B'),
    (r'\bISMS\b', 'I S M S'),
    (r'\bPIMS\b', 'P I M S'),
    (r'\bWAF\b', 'W A F'),
    (r'\bNAS\b', 'N A S'),
    (r'\bAD\b', 'A D'),
    (r'\bCIA\b', 'C I A'),
    (r'\bMFA\b', 'M F A'),
    (r'\bSaaS\b', '沙斯'),
    (r'\bIP\b', 'I P'),
    (r'backup-sync', 'backup sync'),
    (r'3-2-1-1-0', '三二一一零'),
    (r'\bARC\b', 'A R C'),
    (r'\bLINE\b', 'Line'),
]
DIGITS = '零一二三四五六七八九'

# 雲端環境需透過代理與其 CA；本機執行時不受影響
_ca = os.environ.get('TTS_CA_BUNDLE', '/root/.ccr/ca-bundle.crt')
if os.path.exists(_ca):
    _comm._SSL_CTX = ssl.create_default_context(cafile=_ca)
PROXY = os.environ.get('HTTPS_PROXY') or None

NODE_DUMP = r"""
const vm = require('vm'), fs = require('fs');
const [file, id] = process.argv.slice(1);
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(file, 'utf8'), ctx);
if (id) {
  const d = ctx.window.CASE_LIBRARY[id];
  const g = d.games || {};
  const lines = [];
  d.chapters.forEach((c) => c.scenes.forEach((s) => s.lines.forEach((l) => lines.push([l[0], l[2]]))));
  d.questions.forEach((q) => q.hint && lines.push(['arale', q.hint]));
  if (g.decision) g.decision.rounds.forEach((r) => {
    lines.push([r.face[0], r.situation]);
    r.options.forEach((o) => o.allan && lines.push(['allan', o.allan]));
  });
  if (g.law) g.law.pairs.forEach((p) => p.why && lines.push(['allan', p.why]));
  console.log(JSON.stringify(lines));
} else {
  console.log(JSON.stringify(ctx.window.CASE_REGISTRY.filter((c) => c.status === 'ready').map((c) => c.id)));
}
"""


def node_json(*args):
    out = subprocess.run(['node', '-e', NODE_DUMP, *map(str, args)], check=True, capture_output=True, text=True).stdout
    return json.loads(out)


def spoken(text):
    for pat, rep in SPOKEN:
        text = re.sub(pat, rep, text)
    text = text.replace('**', '')
    # 5.24 → 五點二四（控制措施編號逐字唸）
    text = re.sub(r'(?<![\d.])(\d)\.(\d{1,2})(?![\d.])',
                  lambda m: DIGITS[int(m.group(1))] + '點' + ''.join(DIGITS[int(d)] for d in m.group(2)),
                  text)
    return text


def file_name(who, text):
    key = hashlib.sha1(json.dumps([VOICES[who], spoken(text)], ensure_ascii=False).encode()).hexdigest()[:12]
    return f'{who}_{key}.mp3'


async def synth_all(jobs):
    sem = asyncio.Semaphore(4)

    async def one(who, text, path):
        if path.exists() and path.stat().st_size > 0:
            return
        v = VOICES[who]
        tmp = path.with_suffix('.tmp')
        async with sem:
            for attempt in range(4):
                try:
                    await edge_tts.Communicate(spoken(text), v['voice'], rate=v['rate'], pitch=v['pitch'], proxy=PROXY).save(str(tmp))
                    os.replace(tmp, path)
                    print('  tts', path.name, text[:20])
                    return
                except Exception as e:  # 網路偶發錯誤重試
                    print('  retry', attempt, e)
                    await asyncio.sleep(2 ** attempt)
            raise RuntimeError('TTS failed: ' + text)

    await asyncio.gather(*(one(*j) for j in jobs))


def build(case_id):
    lines = node_json(ROOT / 'cases' / case_id / 'case.js', case_id) + [list(x) for x in EXTRA_LINES]
    out = ROOT / 'cases' / case_id / 'voice'
    out.mkdir(exist_ok=True)
    manifest = {}
    jobs = []
    for who, text in lines:
        name = file_name(who, text)
        manifest[who + '|' + text] = name
        jobs.append((who, text, out / name))
    print(f'{case_id}: {len(manifest)} lines')
    asyncio.run(synth_all(jobs))

    keep = set(manifest.values())
    for f in out.glob('*.mp3'):
        if f.name not in keep:
            f.unlink()
            print('  removed', f.name)

    js = ('/* 自動產生：python3 tools/build_voice.py。台詞（角色|文字）對應的語音檔 */\n'
          'window.CASE_VOICE = window.CASE_VOICE || {};\n'
          f'window.CASE_VOICE[{json.dumps(case_id)}] = '
          + json.dumps(manifest, ensure_ascii=False, indent=1) + ';\n')
    (out / 'voice.js').write_text(js, encoding='utf-8')


def main():
    ids = sys.argv[1:] or node_json(ROOT / 'cases' / 'registry.js')
    for case_id in ids:
        build(case_id)


if __name__ == '__main__':
    main()
