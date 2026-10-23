# -*- coding: utf-8 -*-
"""產生個案對話語音：Allan 顧問與 AI 小助手阿拉蕾。

聲音設定沿用既有課程（allanloplus/ISO27001_A01 的 lesson/build_audio.py），
所有個案都使用同一組聲音，請勿任意更換：
  Allan 顧問  zh-TW-YunJheNeural   rate +6%
  阿拉蕾      zh-TW-HsiaoYuNeural  rate +12%  pitch +28Hz

用法：
  pip install edge-tts           （另需 ffmpeg）
  python3 tools/build_voice.py S111001

輸出：
  cases/<案號>/voice/<角色>-<雜湊>.mp3   每句一個檔
  cases/<案號>/voice/voice.js            台詞 → 檔名對照（網站依台詞文字找語音）

合成結果快取在 build/tts/，只有改過的台詞會重新合成；
台詞改了文字，舊的語音檔會自動刪除，網站也不會播放與文字不符的語音。
"""
import asyncio
import hashlib
import json
import os
import re
import ssl
import subprocess
import sys

import edge_tts
import edge_tts.communicate as _comm

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, "build", "tts")

VOICES = {
    "allan": dict(voice="zh-TW-YunJheNeural", rate="+6%", pitch="+0Hz"),
    "arale": dict(voice="zh-TW-HsiaoYuNeural", rate="+12%", pitch="+28Hz"),
}

# 雲端環境需透過代理與其 CA；本機執行時不受影響
_ca = os.environ.get("TTS_CA_BUNDLE", "/root/.ccr/ca-bundle.crt")
if os.path.exists(_ca):
    _comm._SSL_CTX = ssl.create_default_context(cafile=_ca)
PROXY = os.environ.get("HTTPS_PROXY") or None

# 唸法：特定詞彙先換，其餘全大寫縮寫逐字母唸
SPOKEN = [
    (r"ISO 27001", "ISO 兩七零零一"),
    (r"ISO 27701", "ISO 兩七七零一"),
    (r"SaaS", "沙斯"),
    (r"(\d+)\s*GB", r"\1 G B"),
]
WORDS = {"ISO", "LockBit"}  # 照字面唸、不拆字母
DIGITS = "零一二三四五六七八九"


def spoken(text):
    for pat, rep in SPOKEN:
        text = re.sub(pat, rep, text)
    text = re.sub(
        r"(?<![A-Za-z])([A-Z]{2,6})(?![A-Za-z])",
        lambda m: m.group(1) if m.group(1) in WORDS else " " + " ".join(m.group(1)) + " ",
        text,
    )
    # 5.24 → 五點二四（控制措施編號逐字唸）
    text = re.sub(
        r"(\d)\.(\d{1,2})(?!\d)",
        lambda m: DIGITS[int(m.group(1))] + "點" + "".join(DIGITS[int(d)] for d in m.group(2)),
        text,
    )
    return re.sub(r"\s{2,}", " ", text).strip()


def clip_name(who, text):
    key = hashlib.sha1(json.dumps([VOICES[who], spoken(text)], ensure_ascii=False).encode()).hexdigest()[:12]
    return f"{who}-{key}.mp3"


async def synth_all(jobs):
    sem = asyncio.Semaphore(4)

    async def one(who, text, raw):
        if os.path.exists(raw) and os.path.getsize(raw) > 0:
            return
        v = VOICES[who]
        async with sem:
            for attempt in range(4):
                try:
                    await edge_tts.Communicate(spoken(text), v["voice"], rate=v["rate"], pitch=v["pitch"], proxy=PROXY).save(raw + ".tmp")
                    os.replace(raw + ".tmp", raw)
                    print("  tts", who, text[:24])
                    return
                except Exception as e:  # 網路偶發錯誤重試
                    print("  retry", attempt, e)
                    await asyncio.sleep(2 ** attempt)
            raise RuntimeError("TTS failed: " + text)

    await asyncio.gather(*(one(*j) for j in jobs))


def finish(raw, out):
    """去頭尾靜音、統一音量，輸出單聲道 mp3。"""
    af = (
        "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03,"
        "areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.12,areverse,"
        "loudnorm=I=-16:TP=-1.5:LRA=11"
    )
    subprocess.run(
        ["ffmpeg", "-y", "-v", "error", "-i", raw, "-af", af, "-ac", "1", "-ar", "24000", "-c:a", "libmp3lame", "-b:a", "48k", out],
        check=True,
    )


def main():
    if len(sys.argv) != 2 or not re.fullmatch(r"S\d{6}", sys.argv[1]):
        sys.exit("用法：python3 tools/build_voice.py <案號>")
    case_id = sys.argv[1]
    lines = json.loads(subprocess.run(["node", os.path.join(ROOT, "tools", "case_lines.js"), case_id], check=True, capture_output=True, text=True).stdout)

    out_dir = os.path.join(ROOT, "cases", case_id, "voice")
    os.makedirs(CACHE, exist_ok=True)
    os.makedirs(out_dir, exist_ok=True)

    unique = {}
    for ln in lines:
        unique[(ln["who"], ln["text"])] = clip_name(ln["who"], ln["text"])
    jobs = [(who, text, os.path.join(CACHE, name)) for (who, text), name in unique.items()]
    print(f"{case_id}: {len(lines)} 句台詞，{len(unique)} 個語音檔")
    asyncio.run(synth_all(jobs))

    manifest = {"allan": {}, "arale": {}}
    for (who, text), name in unique.items():
        out = os.path.join(out_dir, name)
        if not os.path.exists(out):
            finish(os.path.join(CACHE, name), out)
        manifest[who][text] = name

    keep = set(unique.values())
    for f in os.listdir(out_dir):
        if re.fullmatch(r"(allan|arale)-[0-9a-f]{12}\.mp3", f) and f not in keep:
            os.remove(os.path.join(out_dir, f))
            print("  removed", f)

    with open(os.path.join(out_dir, "voice.js"), "w", encoding="utf-8") as fh:
        fh.write(f"/* 自動產生：python3 tools/build_voice.py {case_id}（請勿手動修改） */\n")
        fh.write("window.CASE_VOICE = window.CASE_VOICE || {};\n")
        fh.write(f"window.CASE_VOICE[{json.dumps(case_id)}] = ")
        json.dump(manifest, fh, ensure_ascii=False, indent=1)
        fh.write(";\n")
    size = sum(os.path.getsize(os.path.join(out_dir, n)) for n in keep)
    print(f"done: {len(keep)} 個檔案，共 {size // 1024} KB → cases/{case_id}/voice/")


if __name__ == "__main__":
    main()
