"""Four numbers per image. Three are plain arithmetic; one is a small model.

No LLM judges anything here. Whether an image matches its prompt, carries the
brand palette, or leaves the call-to-action area clear are all measurable, and
measuring beats asking. The open question this project exists to answer is
whether these measurements agree with a human -- see analyze.py.
"""

import json
from pathlib import Path

import numpy as np
import torch
from PIL import Image
from transformers import CLIPModel, CLIPProcessor

CLIP = "openai/clip-vit-base-patch32"
# RGB distance below which a pixel counts as on-brand. At 60, 18 of 60 images
# scored zero and could not be ranked against each other; at 120 nearly half
# of every image counted, which is not credible. See calibrate.py.
# ponytail: RGB distance, not perceptual. LAB if it starts misjudging hues.
COLOR_TOLERANCE = 90.0
CTA_BOX = (0.25, 0.75, 0.75, 1.0)  # left, top, right, bottom as fractions
# Same shape and size, at the top instead. A control: if flatness *here*
# predicts a human rating as well as flatness in the CTA box does, then the
# CTA metric is detecting a generally chaotic image and the mobile-ad framing
# is a story told after the fact.
CONTROL_BOX = (0.25, 0.0, 0.75, 0.25)
# Maps luminance spread onto 0-1. Luminance standard deviation tops out near
# 0.5 (half black, half white), so 2.0 spans the real range without the clamp
# ever firing. At 4.0 it fired on 21 of 60 images, tying a third of the set
# at zero. See calibrate.py.
BUSY_SCALE = 2.0


def brand_colour_coverage(image: Image.Image, palette: list[list[int]]) -> float:
    """Fraction of pixels near any brand colour.

    Downsampled first: we are asking whether the palette is present, and a
    thumbnail answers that as well as two million pixels do.
    """
    pixels = np.asarray(image.resize((64, 64)).convert("RGB"), dtype=np.float32)
    distances = np.stack(
        [np.linalg.norm(pixels - np.array(c, dtype=np.float32), axis=-1) for c in palette]
    )
    return float((distances.min(axis=0) < COLOR_TOLERANCE).mean())


def clarity(image: Image.Image, box: tuple[float, float, float, float]) -> float:
    """How flat a region is, 0-1. Higher is cleaner.

    Busy-ness is the standard deviation of luminance inside the box, rescaled
    so 0 is chaos and 1 is flat. Taking a region rather than the whole image is
    the entire point: mobile ad creatives put the install button in the bottom
    centre, so a busy strip *there* makes a creative unusable however good the
    rest of it looks.
    """
    grey = np.asarray(image.convert("L"), dtype=np.float32) / 255.0
    h, w = grey.shape
    left, top, right, bottom = box
    box = grey[int(top * h) : int(bottom * h), int(left * w) : int(right * w)]
    return float(max(0.0, 1.0 - box.std() * BUSY_SCALE))


def main() -> None:
    brief = json.loads(Path("brief.json").read_text())
    index = json.loads(Path("index.json").read_text())

    model = CLIPModel.from_pretrained(CLIP).eval()
    processor = CLIPProcessor.from_pretrained(CLIP)

    images = [Image.open(Path("web/public/images") / row["file"]).convert("RGB") for row in index]

    with torch.no_grad():
        inputs = processor(
            text=[row["text"] for row in index],
            images=images,
            return_tensors="pt",
            padding=True,
            truncation=True,
        )
        out = model(**inputs)
        # Normalised, so a dot product IS the cosine similarity.
        image_vecs = torch.nn.functional.normalize(out.image_embeds, dim=-1)
        text_vecs = torch.nn.functional.normalize(out.text_embeds, dim=-1)

    adherence = (image_vecs * text_vecs).sum(dim=-1).numpy()

    # Nearest *other* image: high means we produced a near-duplicate. The
    # diagonal is each image against itself, so it is removed before the max.
    similarity = (image_vecs @ image_vecs.T).numpy()
    np.fill_diagonal(similarity, -1.0)
    nearest = similarity.max(axis=1)

    scores = [
        {
            **row,
            "adherence": round(float(adherence[i]), 4),
            "brand_colour": round(brand_colour_coverage(images[i], brief["brand_colors"]), 4),
            "cta_clarity": round(clarity(images[i], CTA_BOX), 4),
            "control_clarity": round(clarity(images[i], CONTROL_BOX), 4),
            "nearest_other": round(float(nearest[i]), 4),
        }
        for i, row in enumerate(index)
    ]
    Path("scores.json").write_text(json.dumps(scores, indent=2))
    print(f"scored {len(scores)} images")


if __name__ == "__main__":
    main()
