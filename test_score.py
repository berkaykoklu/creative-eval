"""The checks that would fail if the arithmetic broke.

Synthetic images with a known answer, so each test states what the metric is
supposed to mean rather than pinning whatever it happened to return.
"""

import numpy as np
import pytest
from PIL import Image

from score import brand_colour_coverage, cta_clarity

ORANGE = [255, 92, 51]
PALETTE = [ORANGE, [43, 191, 168]]


def solid(colour: list[int]) -> Image.Image:
    return Image.new("RGB", (256, 256), tuple(colour))


def test_an_all_brand_image_scores_one_and_an_off_brand_one_scores_zero() -> None:
    assert brand_colour_coverage(solid(ORANGE), PALETTE) == 1.0
    # Grey is far from every brand colour in the palette.
    assert brand_colour_coverage(solid([128, 128, 128]), PALETTE) == 0.0


def test_half_brand_image_scores_about_half() -> None:
    image = solid(ORANGE)
    image.paste(solid([128, 128, 128]).crop((0, 0, 256, 128)), (0, 0))

    assert 0.4 < brand_colour_coverage(image, PALETTE) < 0.6


def test_a_flat_cta_area_is_clear_and_a_noisy_one_is_not() -> None:
    flat = solid([200, 200, 200])
    rng = np.random.default_rng(0)
    noisy = Image.fromarray(rng.integers(0, 255, (256, 256, 3), dtype=np.uint8))

    # approx, not ==: 200/255 has no exact float32 form, so a perfectly flat
    # image lands a rounding error short of 1.0.
    # Direction and a floor on the separation, not an exact figure: the size of
    # the gap moves with BUSY_SCALE, so pinning it would only re-state the
    # constant and this test would fail every time the metric is recalibrated
    # -- which is the one moment it most needs to still be meaningful.
    assert cta_clarity(flat) == pytest.approx(1.0)
    assert cta_clarity(noisy) < cta_clarity(flat) - 0.3


def test_only_the_bottom_centre_counts() -> None:
    # Noise in the top half must not lower the score: the metric exists to ask
    # whether the install button has somewhere clean to sit, and the top of the
    # creative is free to be as busy as it likes.
    rng = np.random.default_rng(0)
    image = solid([200, 200, 200])
    noise = Image.fromarray(rng.integers(0, 255, (128, 256, 3), dtype=np.uint8))
    image.paste(noise, (0, 0))

    assert cta_clarity(image) == pytest.approx(1.0)
