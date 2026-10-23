"""從角色設定圖切出網站用的角色貼圖（白色貼紙外框、透明背景、WebP）。

用法：python3 tools/make_sprites.py
來源：assets/src/allan-sheet.jpg、assets/src/arale-sheet.jpg
輸出：assets/img/allan/*.webp、assets/img/arale/*.webp

座標以原始 2000x1493 設定圖為準；換新的設定圖時調整 SPRITES 即可。
"""
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "src"
OUT = ROOT / "assets" / "img"

# (來源檔, 輸出路徑, 裁切框 left, top, right, bottom, 輸出最大高度)
SPRITES = [
    # Allan 顧問
    ("allan-sheet.jpg", "allan/full.webp", (80, 95, 778, 1478), 900),
    ("allan-sheet.jpg", "allan/stand.webp", (778, 115, 990, 730), 700),
    ("allan-sheet.jpg", "allan/smile.webp", (762, 785, 1030, 1122), 380),
    ("allan-sheet.jpg", "allan/laugh.webp", (1068, 785, 1338, 1122), 380),
    ("allan-sheet.jpg", "allan/think.webp", (1378, 785, 1638, 1122), 380),
    ("allan-sheet.jpg", "allan/trouble.webp", (1638, 785, 1972, 1122), 380),
    ("allan-sheet.jpg", "allan/surprise.webp", (762, 1128, 1030, 1470), 380),
    ("allan-sheet.jpg", "allan/point.webp", (1040, 1128, 1340, 1470), 380),
    ("allan-sheet.jpg", "allan/wink.webp", (1378, 1128, 1650, 1470), 380),
    ("allan-sheet.jpg", "allan/shock.webp", (1690, 1128, 1968, 1470), 380),
    # AI 小助手 阿拉蕾
    ("arale-sheet.jpg", "arale/full.webp", (70, 795, 410, 1478), 900),
    ("arale-sheet.jpg", "arale/hello.webp", (88, 120, 450, 768), 800),
    ("arale-sheet.jpg", "arale/tablet.webp", (1150, 145, 1562, 748), 700),
    ("arale-sheet.jpg", "arale/present.webp", (1562, 145, 1990, 748), 700),
    ("arale-sheet.jpg", "arale/laugh.webp", (441, 811, 792, 1110), 360),
    ("arale-sheet.jpg", "arale/think.webp", (826, 811, 1179, 1110), 360),
    ("arale-sheet.jpg", "arale/surprise.webp", (1214, 811, 1564, 1110), 360),
    ("arale-sheet.jpg", "arale/confused.webp", (1598, 811, 1949, 1110), 360),
    ("arale-sheet.jpg", "arale/explain.webp", (441, 1147, 792, 1446), 360),
    ("arale-sheet.jpg", "arale/cry.webp", (826, 1147, 1179, 1446), 360),
    ("arale-sheet.jpg", "arale/thumb.webp", (1214, 1147, 1564, 1446), 360),
    ("arale-sheet.jpg", "arale/cheer.webp", (1598, 1147, 1949, 1446), 360),
]

STICKER_RADIUS = 6  # 白色貼紙外框寬度（像素，以原始解析度計）


def background_mask(rgb: np.ndarray) -> np.ndarray:
    """從裁切框四邊向內 flood fill，標出與邊緣相連的淺色背景。"""
    h, w, _ = rgb.shape
    mx = rgb.max(axis=2).astype(int)
    mn = rgb.min(axis=2).astype(int)
    light = (mn > 222) & (mx - mn < 28)
    bg = np.zeros((h, w), dtype=bool)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if light[y, x] and not bg[y, x]:
                bg[y, x] = True
                q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if light[y, x] and not bg[y, x]:
                bg[y, x] = True
                q.append((y, x))
    while q:
        y, x = q.popleft()
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < h and 0 <= nx < w and light[ny, nx] and not bg[ny, nx]:
                bg[ny, nx] = True
                q.append((ny, nx))
    return bg


# 阿拉蕾設定圖上的灰色分隔線（y 範圍），切圖前先抹白，避免黏在鞋子上
RULE_BANDS = {"arale-sheet.jpg": [(134, 150), (734, 754)]}


def erase_rules(img: Image.Image, bands) -> Image.Image:
    arr = np.asarray(img.convert("RGB")).copy()
    for top, bottom in bands:
        band = arr[top:bottom].astype(int)
        mx, mn = band.max(axis=2), band.min(axis=2)
        gray = (mx - mn < 22) & (mn > 140)
        band[gray] = 255
        arr[top:bottom] = band.astype(np.uint8)
    return Image.fromarray(arr)


def keep_main_shapes(fg: np.ndarray, min_ratio: float = 0.04) -> np.ndarray:
    """只保留主要的前景區塊，去掉從鄰近圖案或文字標籤帶進來的碎片。"""
    h, w = fg.shape
    labels = np.zeros((h, w), dtype=np.int32)
    sizes = [0]
    current = 0
    for sy, sx in zip(*np.nonzero(fg)):
        if labels[sy, sx]:
            continue
        current += 1
        labels[sy, sx] = current
        q = deque([(sy, sx)])
        n = 0
        while q:
            y, x = q.popleft()
            n += 1
            for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                if 0 <= ny < h and 0 <= nx < w and fg[ny, nx] and not labels[ny, nx]:
                    labels[ny, nx] = current
                    q.append((ny, nx))
        sizes.append(n)
    sizes = np.array(sizes)
    keep = sizes >= sizes.max() * min_ratio
    keep[0] = False
    return keep[labels]


def make_sprite(src: Image.Image, box, max_h: int) -> Image.Image:
    pad = STICKER_RADIUS + 4
    crop = src.crop(box).convert("RGB")
    # 四周補白，讓貼紙外框不會被裁到
    canvas = Image.new("RGB", (crop.width + pad * 2, crop.height + pad * 2), (255, 255, 255))
    canvas.paste(crop, (pad, pad))
    rgb = np.asarray(canvas)
    fg = keep_main_shapes(~background_mask(rgb))

    fg_img = Image.fromarray((fg * 255).astype(np.uint8), "L")
    # 去掉細小雜點後再外擴成貼紙邊
    fg_img = fg_img.filter(ImageFilter.MedianFilter(3))
    sticker = fg_img.filter(ImageFilter.MaxFilter(STICKER_RADIUS * 2 + 1))
    sticker = sticker.filter(ImageFilter.GaussianBlur(0.8))

    white = Image.new("RGB", canvas.size, (255, 255, 255))
    body = Image.composite(canvas, white, fg_img.filter(ImageFilter.GaussianBlur(0.6)))
    out = body.convert("RGBA")
    out.putalpha(sticker)

    bbox = out.getbbox()
    if bbox:
        out = out.crop(bbox)
    if out.height > max_h:
        ratio = max_h / out.height
        out = out.resize((round(out.width * ratio), max_h), Image.LANCZOS)
    return out


def main():
    cache = {}
    for src_name, out_name, box, max_h in SPRITES:
        if src_name not in cache:
            img = Image.open(SRC / src_name)
            cache[src_name] = erase_rules(img, RULE_BANDS.get(src_name, []))
        sprite = make_sprite(cache[src_name], box, max_h)
        dest = OUT / out_name
        dest.parent.mkdir(parents=True, exist_ok=True)
        sprite.save(dest, "WEBP", quality=86, method=6)
        print(f"{out_name:24s} {sprite.width}x{sprite.height}  {dest.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
