#!/usr/bin/env python3
"""
Generates the Office-cc application icon set:

  apps/shell/build/icon.png          1024, transparent, used as the docs window
                                     icon in dev on Linux/Windows
  apps/shell/build/icons/*.png       the raster set electron-builder reads
                                     (mac / win / linux) and the flatpak manifest
  apps/shell/build/icon-mac.png      1024 with the macOS app-icon grid margin
                                     (824/1024 content)
  apps/shell/build/icon.icns         macOS bundle icon, same grid margin
  apps/shell/build/icon.ico          Windows icon (PNG-compressed entries)

The mark is drawn analytically rather than rasterised from a bitmap: a big C
and a small C nested inside its counter, their mouths opening in opposite
directions so the pair reads as an antagonistic weave rather than a doubled
letter. The small C passes over the big one at the crossing. Drawing it from
geometry keeps the stroke weight, the mouth angle and the 180-degree
relationship exact at every output size, and it is the reason the 16px build
stays legible.

Regenerate after changing the constants below:
  python3 tools/gen-app-icon.py

Needs Pillow and numpy (same environment-provided assumption as the other
tools/*.py font scripts).
"""

import os
import shutil
import struct
import subprocess
import sys
import tempfile

import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUILD = os.path.join(ROOT, 'apps', 'shell', 'build')

SIZE = 1024
SS = 4  # supersampling factor; every length below is in canvas pixels

# --- the mark -------------------------------------------------------------
BIG_RM = 300.0        # centreline radius of the big C
BIG_HW = 72.0         # half of its stroke width
BIG_GAP = 56.0        # half angle of its mouth, in degrees
BIG_FACE = 0.0        # the big C opens to the right
SMALL_RM = 138.0      # the nested C
SMALL_HW = 50.0
SMALL_GAP = 60.0
SMALL_FACE = 180.0    # ...and the small one opens back at it
SMALL_DX = -70.0      # the nested C sits up and to the left
SMALL_DY = -66.0
WEAVE = 7.0           # gap that makes the small C read as passing over

TOP = np.array([63, 153, 255], np.float32)    # #3f99ff
BOTTOM = np.array([14, 114, 229], np.float32)  # #0e72e5

# --- output geometry ------------------------------------------------------
# The big C opens to the right and the nested C opens to the left, so the two
# letterforms answer each other instead of merging into one closed ring.
ICON_SET = [16, 32, 48, 64, 128, 256, 512, 1024]
MAC_CONTENT_RATIO = 824 / 1024   # the macOS app-icon grid margin
PLATFORM_CONTENT_RATIO = 0.88    # a round mark needs air on the square canvas
ICO_SIZES = [16, 24, 32, 48, 64, 128, 256]


def arc_mask(cx, cy, rm, hw, gap_deg, face_deg=0.0):
    """A stroked circular arc with round caps; the mouth opens toward `face_deg`.

    Angles are screen angles (y grows downward), measured from the +x axis.
    """
    m = SIZE * SS
    y, x = np.mgrid[0:m, 0:m].astype(np.float32)
    dx = x - cx
    dy = y - cy
    r = np.sqrt(dx * dx + dy * dy)
    face = np.deg2rad(face_deg)
    a = np.mod(np.arctan2(dy, dx) - face, 2 * np.pi)
    gap = np.deg2rad(gap_deg)
    inside = (a >= gap) & (a <= 2 * np.pi - gap)
    d_circ = np.abs(r - rm)
    e1 = rm * np.array([np.cos(gap + face), np.sin(gap + face)])
    e2 = rm * np.array([np.cos(-gap + face), np.sin(-gap + face)])
    d1 = np.sqrt((dx - e1[0]) ** 2 + (dy - e1[1]) ** 2)
    d2 = np.sqrt((dx - e2[0]) ** 2 + (dy - e2[1]) ** 2)
    d = np.where(inside, d_circ, np.minimum(d1, d2))
    return d <= hw


def build_mark():
    """The full-bleed mark at canvas resolution, as an RGBA image."""
    m = SIZE * SS
    centre = m / 2.0
    big = arc_mask(centre, centre, BIG_RM * SS, BIG_HW * SS, BIG_GAP, BIG_FACE)
    small = arc_mask(
        centre + SMALL_DX * SS,
        centre + SMALL_DY * SS,
        SMALL_RM * SS,
        SMALL_HW * SS,
        SMALL_GAP,
        SMALL_FACE,
    )

    weave = int(WEAVE * SS)
    spread = np.array(
        Image.fromarray((small * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(2 * weave + 1))
    ) > 0
    big_vis = big & ~spread
    mask = big_vis | small

    # the big C darkens along the cut, which is what sells the over/under
    edge = np.array(
        Image.fromarray((big_vis * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(2 * weave + 1))
    ) == 0
    edge = edge & spread

    yy, xx = np.mgrid[0:m, 0:m].astype(np.float32)
    t = (xx / m * 0.5 + yy / m * 0.5)[..., None]
    rgb = TOP[None, None, :] * (1 - t) + BOTTOM[None, None, :] * t
    rgb = np.where(edge[..., None], rgb * 0.8, rgb)

    alpha = (mask.astype(np.float32) * 255).astype(np.uint8)
    img = Image.fromarray(np.dstack([rgb.astype(np.uint8), alpha]), 'RGBA')
    return fit(img, mask, PLATFORM_CONTENT_RATIO)


def fit(img, mask, ratio):
    """Uniformly scale the mark's bounding box to `ratio` of the canvas, centred."""
    m = SIZE * SS
    ys, xs = np.nonzero(mask)
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    target = SIZE * ratio * SS
    scale = target / max(x1 - x0, y1 - y0)
    crop = img.crop((x0, y0, x1 + 1, y1 + 1)).resize(
        (
            max(1, int((x1 - x0 + 1) * scale)),
            max(1, int((y1 - y0 + 1) * scale)),
        ),
        Image.LANCZOS,
    )
    canvas = Image.new('RGBA', (m, m), (0, 0, 0, 0))
    canvas.paste(crop, ((m - crop.width) // 2, (m - crop.height) // 2), crop)
    return canvas.resize((SIZE, SIZE), Image.LANCZOS)


def with_ratio(img, ratio):
    """Re-fit an already-rendered mark to a different canvas ratio."""
    alpha = np.array(img)[..., 3]
    return fit(img, alpha > 128, ratio)


def build_ico(images):
    """ICO container with PNG-compressed entries (supported since Vista)."""
    header = struct.pack('<HHH', 0, 1, len(images))
    entries = b''
    offset = 6 + 16 * len(images)
    body = b''
    for size, png in images:
        entries += struct.pack(
            '<BBBBHHII',
            0 if size >= 256 else size,
            0 if size >= 256 else size,
            0,
            0,
            1,
            32,
            len(png),
            offset,
        )
        offset += len(png)
        body += png
    return header + entries + body


def main():
    mark = build_mark()
    mac_mark = with_ratio(mark, MAC_CONTENT_RATIO)

    os.makedirs(os.path.join(BUILD, 'icons'), exist_ok=True)
    mark.save(os.path.join(BUILD, 'icon.png'))
    for size in ICON_SET:
        mark.resize((size, size), Image.LANCZOS).save(
            os.path.join(BUILD, 'icons', f'{size}x{size}.png')
        )
    mac_mark.save(os.path.join(BUILD, 'icon-mac.png'))

    ico_images = []
    for size in ICO_SIZES:
        buf = tempfile.NamedTemporaryFile(suffix='.png', delete=False)
        buf.close()
        mark.resize((size, size), Image.LANCZOS).save(buf.name)
        with open(buf.name, 'rb') as fh:
            ico_images.append((size, fh.read()))
        os.unlink(buf.name)
    with open(os.path.join(BUILD, 'icon.ico'), 'wb') as fh:
        fh.write(build_ico(ico_images))

    if sys.platform == 'darwin' and shutil.which('iconutil'):
        tmp = tempfile.mkdtemp()
        try:
            iconset = os.path.join(tmp, 'icon.iconset')
            os.makedirs(iconset)
            for name, size in [
                ('icon_16x16.png', 16),
                ('icon_16x16@2x.png', 32),
                ('icon_32x32.png', 32),
                ('icon_32x32@2x.png', 64),
                ('icon_128x128.png', 128),
                ('icon_128x128@2x.png', 256),
                ('icon_256x256.png', 256),
                ('icon_256x256@2x.png', 512),
                ('icon_512x512.png', 512),
                ('icon_512x512@2x.png', 1024),
            ]:
                mac_mark.resize((size, size), Image.LANCZOS).save(os.path.join(iconset, name))
            subprocess.run(
                ['iconutil', '-c', 'icns', iconset, '-o', os.path.join(BUILD, 'icon.icns')],
                check=True,
            )
        finally:
            shutil.rmtree(tmp, ignore_errors=True)
    else:
        print('iconutil not available: build/icon.icns left untouched')

    print('wrote icon.png, icons/*.png, icon-mac.png, icon.ico, icon.icns into', BUILD)


if __name__ == '__main__':
    main()
