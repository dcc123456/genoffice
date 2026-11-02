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

The mark itself is artwork, not geometry: tools/icon-source.png holds it, a
closed ring with a smaller letter C nested in its counter.  The small C's
mouth opens to the right in the source drawing; here it is reversed, so the
letter answers the ring instead of doubling it.  It is kept as a bitmap
rather than redrawn from constants because its stroke weight, the angle of
the C's terminals and the way the two forms nest are the whole design, and
re-deriving them from numbers would drift from the drawing every time the
numbers were touched.

Regenerate after changing the source artwork:
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
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUILD = os.path.join(ROOT, 'apps', 'shell', 'build')
SOURCE = os.path.join(ROOT, 'tools', 'icon-source.png')

# the in-app copies of the same mark, kept in step with the bundle icon
APP_ICON_COPIES = [
    'apps/shell/src/renderer/src/assets/app-icon.png',
    'apps/docs/src/renderer/assets/app-icon.png',
    'apps/slides/src/renderer/assets/app-icon.png',
    'apps/sheets/src/renderer/assets/app-icon.png',
]

SIZE = 1024

# --- output geometry ------------------------------------------------------
ICON_SET = [16, 32, 48, 64, 128, 256, 512, 1024]
MAC_CONTENT_RATIO = 824 / 1024   # the macOS app-icon grid margin
PLATFORM_CONTENT_RATIO = 0.88    # a round mark needs air on the square canvas
ICO_SIZES = [16, 24, 32, 48, 64, 128, 256]


def load_art():
    """The source artwork, cropped to the mark's own ink."""
    img = Image.open(SOURCE).convert('RGBA')
    alpha = np.array(img)[..., 3]
    ys, xs = np.nonzero(alpha > 8)
    return img.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))


def fit(img, ratio):
    """Scale the artwork to `ratio` of the canvas, centred."""
    w, h = img.size
    scale = SIZE * ratio / max(w, h)
    new = (max(1, round(w * scale)), max(1, round(h * scale)))
    art = img.resize(new, Image.LANCZOS)
    canvas = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    canvas.paste(art, ((SIZE - new[0]) // 2, (SIZE - new[1]) // 2), art)
    return canvas


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
    art = load_art()
    mark = fit(art, PLATFORM_CONTENT_RATIO)
    mac_mark = fit(art, MAC_CONTENT_RATIO)

    os.makedirs(os.path.join(BUILD, 'icons'), exist_ok=True)
    mark.save(os.path.join(BUILD, 'icon.png'))
    for size in ICON_SET:
        mark.resize((size, size), Image.LANCZOS).save(
            os.path.join(BUILD, 'icons', f'{size}x{size}.png')
        )
    mac_mark.save(os.path.join(BUILD, 'icon-mac.png'))

    for rel in APP_ICON_COPIES:
        path = os.path.join(ROOT, rel)
        if os.path.exists(path):
            mark.save(path)

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
