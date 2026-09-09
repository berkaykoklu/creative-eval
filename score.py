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
COLOR_TOLERANCE = 60.0  # ponytail: RGB distance, not perceptual. LAB if it misjudges.
CTA_BOX = (0.25, 0.75, 0.75, 1.0)  # left, top, right, bottom as fractions
# Maps luminance spread onto 0-1. Calibrated against the real output in
# calibrate.py, not derived: pick it badly and every image scores the same.
BUSY_SCALE = 4.0


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


def cta_clarity(image: Image.Image) -> float:
    """How clean the bottom-centre is, 0-1. Higher is better.

    Mobile ad creatives put the install button here, so a busy strip makes an
    image unusable no matter how good it looks. Busy-ness is the standard
    deviation of luminance inside the box, rescaled so 0 is chaos and 1 is flat.
    """
    grey = np.asarray(image.convert("L"), dtype=np.float32) / 255.0
    h, w = grey.shape
    left, top, right, bottom = CTA_BOX
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
            "cta_clarity": round(cta_clarity(images[i]), 4),
            "nearest_other": round(float(nearest[i]), 4),
        }
        for i, row in enumerate(index)
    ]
    Path("scores.json").write_text(json.dumps(scores, indent=2))
    print(f"scored {len(scores)} images")


if __name__ == "__main__":
    main()
