"""Brief -> prompts -> images. Runs once, offline; the images are committed.

The site never runs this. Generation is slow and the result is what matters,
so it happens deliberately here and the output is checked in -- which also
makes the numbers on the site reproducible rather than merely claimed.
"""

import json
from itertools import product
from pathlib import Path

import torch
from diffusers import AutoPipelineForText2Image

MODEL = "stabilityai/sd-turbo"
SEEDS = [0, 1, 2, 3, 4]
# Straight into the site's public folder: one copy of each image, living
# where the page serves it from. WebP because 60 lossless PNGs are ~30MB of
# repository for a difference nobody can see on a screen.
OUT = Path("web/public/images")


def prompts(brief: dict) -> list[dict]:
    """Every subject in every style. A grid, not a wishlist: holding one axis
    fixed while varying the other is what lets the scores below say *which*
    axis moved the metric."""
    return [
        {"id": f"s{si}_t{ti}", "subject": s, "style": t, "text": f"{s}, {t}, mobile game ad"}
        for (si, s), (ti, t) in product(enumerate(brief["subjects"]), enumerate(brief["styles"]))
    ]


def main() -> None:
    brief = json.loads(Path("brief.json").read_text())
    OUT.mkdir(parents=True, exist_ok=True)

    pipe = AutoPipelineForText2Image.from_pretrained(
        MODEL, torch_dtype=torch.float16, variant="fp16"
    ).to("mps")

    index = []
    for p in prompts(brief):
        for seed in SEEDS:
            name = f"{p['id']}_seed{seed}.webp"
            index.append({**p, "seed": seed, "file": name})
            if (OUT / name).exists():
                continue  # resumable: a crash halfway costs only what is missing
            image = pipe(
                prompt=p["text"],
                num_inference_steps=2,  # sd-turbo is distilled: 1-4 steps, not 50
                guidance_scale=0.0,  # turbo models are trained without CFG
                generator=torch.Generator("mps").manual_seed(seed),
            ).images[0]
            image.save(OUT / name, quality=90)
            print(name, flush=True)

    Path("index.json").write_text(json.dumps(index, indent=2))
    print(f"{len(index)} images")


if __name__ == "__main__":
    main()
