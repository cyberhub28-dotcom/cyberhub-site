"""Draws the Wedding Command Center app icon in code: two linked gold rings
and a small diamond on a deep navy background. Made for CyberHub Software.

Run from the app folder:  python3 tools/make_icon.py
Writes icon-180.png, icon-192.png and icon-512.png, and prints the 180 icon
as a data URL for shell.html. Needs Pillow."""
import base64, io, math
from PIL import Image, ImageDraw, ImageFilter

S = 2048                      # drawn big, then scaled down for smooth edges
U = S / 180                   # one unit = one point of the 180 icon
NAVY_TL, NAVY_BR = (27, 32, 66), (43, 35, 83)
GLOW = (90, 85, 96)
GOLD = (227, 198, 144)


def draw():
    # background: navy gradient, corner to corner
    bg = Image.new('RGB', (S, S))
    px = bg.load()
    for y in range(S):
        for x in range(0, S):
            t = (x + y) / (2 * S)
            px[x, y] = tuple(round(a + (b - a) * t) for a, b in zip(NAVY_TL, NAVY_BR))
    # soft light from the top right corner
    glow = Image.new('L', (S, S), 0)
    ImageDraw.Draw(glow).ellipse([S * 0.55, -S * 0.45, S * 1.45, S * 0.45], fill=150)
    glow = glow.filter(ImageFilter.GaussianBlur(S * 0.12))
    bg = Image.composite(Image.new('RGB', (S, S), GLOW), bg, glow)

    d = ImageDraw.Draw(bg)
    stroke = round(6 * U)
    r = 35.5 * U
    for cx in (71.5, 107.5):          # the two rings
        c, cy = cx * U, 98.5 * U
        d.ellipse([c - r, cy - r, c + r, cy + r], outline=GOLD, width=stroke)
    cx, cy, h = 90 * U, 46.5 * U, 8.5 * U   # the diamond, as an outline
    pts = [(cx, cy - h), (cx + h, cy), (cx, cy + h), (cx - h, cy)]
    d.line(pts + [pts[0], pts[1]], fill=GOLD, width=round(3.6 * U), joint='curve')
    return bg


def main():
    big = draw()
    out = {}
    for n in (180, 192, 512):
        im = big.resize((n, n), Image.LANCZOS)
        im.save('icon-%d.png' % n, optimize=True)
        b = io.BytesIO(); im.save(b, 'PNG', optimize=True); out[n] = b.getvalue()
    print('data:image/png;base64,' + base64.b64encode(out[180]).decode())


if __name__ == '__main__':
    main()
