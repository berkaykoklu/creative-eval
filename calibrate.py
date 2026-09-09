"""Evidence for the two constants in score.py. Run before any human rating.

Both constants set a threshold, and a threshold can destroy a metric silently:
too aggressive and most images tie at zero, leaving nothing to rank. This
prints the distribution each candidate produces so the choice is a measurement
rather than a preference.

The order matters. This runs *before* ratings.json exists, so the constants
cannot be tuned toward a correlation that does not exist yet -- which is the
difference between calibrating an instrument and manufacturing a result.
"""

import json
from pathlib import Path

import numpy as np
from PIL import Image

import score

BUSY_SCALES = [2.0, 2.5, 3.0, 4.0]
TOLERANCES = [60, 90, 120, 150]


def main() -> None:
    brief = json.loads(Path("brief.json").read_text())
    index = json.loads(Path("index.json").read_text())
    images = [Image.open(Path("web/public/images") / row["file"]).convert("RGB") for row in index]

    print("BUSY_SCALE — a clamped image carries no rank")
    for scale in BUSY_SCALES:
        score.BUSY_SCALE = scale
        values = np.array([score.cta_clarity(image) for image in images])
        print(
            f"  {scale:>4}: {(values == 0).sum():2d}/{len(values)} clamped to zero, "
            f"range {values.min():.2f}-{values.max():.2f}"
        )

    print("\nCOLOR_TOLERANCE — too tight ties at zero, too loose calls everything on-brand")
    for tolerance in TOLERANCES:
        score.COLOR_TOLERANCE = float(tolerance)
        values = np.array(
            [score.brand_colour_coverage(image, brief["brand_colors"]) for image in images]
        )
        print(
            f"  {tolerance:>4}: {(values < 0.005).sum():2d}/{len(values)} near zero, "
            f"median {np.median(values):.3f}, max {values.max():.3f}"
        )


if __name__ == "__main__":
    main()
