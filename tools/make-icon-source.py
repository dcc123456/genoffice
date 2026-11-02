#!/usr/bin/env python3
"""
Separates the Office-cc icon artwork from the ground it was drawn on.

tools/icon-reference.png is the drawing the brand was settled on: a closed
ring with a smaller letter C nested in its counter, the C's mouth opening to
the right.  It is kept as a bitmap because its stroke weight, the angle of
the C's terminals and the way the two forms nest are the whole design, and
re-deriving them from numbers would drift from the drawing every time the
numbers were touched.

The app icon wants the same drawing with the paper made transparent, so this
script fits a smooth model of the ground and of the ink and recovers, for
every pixel, how much ink covers it.  That coverage is the alpha the icon
set is generated from (tools/gen-app-icon.py).

  python3 tools/make-icon-source.py

Needs Pillow and numpy (same environment-provided assumption as the other
tools/*.py scripts).
"""

import os

import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REFERENCE = os.path.join(ROOT, 'tools', 'icon-reference.png')
SOURCE = os.path.join(ROOT, 'tools', 'icon-source.png')


def fit(design, values, selection):
    return np.linalg.lstsq(design[selection], values[selection], rcond=None)[0]


def main():
    art = np.asarray(Image.open(REFERENCE).convert('RGB')).astype(np.float64)
    h, w, _ = art.shape
    yy, xx = np.mgrid[0:h, 0:w]
    xf = xx.ravel().astype(float)
    yf = yy.ravel().astype(float)
    design = np.stack([np.ones_like(xf), xf, yf, xf * xf, yf * yf, xf * yf], 1)
    design = design.reshape(h, w, 6)

    def model(coef):
        return (design.reshape(h * w, 6) @ coef).reshape(h, w)

    mx = art.max(2)
    mn = art.min(2)
    sat = (mx - mn) / np.maximum(mx, 1)

    # the ground: every pixel that is neither ink nor close to ink
    ink = sat > 0.25
    clear = ~np.asarray(Image.fromarray((ink * 255).astype(np.uint8))
                        .filter(ImageFilter.MaxFilter(61))) > 0
    ground_sel = clear & (sat < 0.10)
    ground = np.stack([model(fit(design, art[:, :, c], ground_sel)) for c in range(3)], 2)

    # the ink: the solid core of the strokes, where the drawing is at full strength
    core_sel = sat > 0.5
    ink_model = np.stack([model(fit(design, art[:, :, c], core_sel)) for c in range(3)], 2)

    # coverage: how far the observed colour sits along ground -> ink
    d = ink_model - ground
    alpha = np.clip(((art - ground) * d).sum(2) / np.maximum((d * d).sum(2), 1e-9), 0, 1)
    alpha[~ink] = 0.0

    # un-premultiply back to the pure ink colour; near the edge the result is
    # noise, so those pixels are handed the modelled ink instead
    unpre = (art - (1 - alpha[..., None]) * ground) / np.maximum(alpha, 1e-3)[..., None]
    w = np.clip((alpha - 0.35) / 0.5, 0, 1)[..., None]
    rgb = np.clip(w * np.clip(unpre, 0, 255) + (1 - w) * ink_model, 0, 255)
    rgb[alpha < 0.004] = 0.0

    Image.fromarray(np.dstack([rgb.astype(np.uint8),
                               (np.clip(alpha, 0, 1) * 255).astype(np.uint8)]),
                    'RGBA').save(SOURCE)
    print('wrote', SOURCE)


if __name__ == '__main__':
    main()
