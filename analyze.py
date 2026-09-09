"""Do the automatic scores agree with a human? That is the whole project.

Generating images is an API call anyone can make. The question worth asking is
whether a metric you would filter thousands of creatives with actually tracks
what a person picks -- and reporting the answer even when it is unflattering.
"""

import json
from pathlib import Path

import numpy as np

METRICS = ["adherence", "brand_colour", "cta_clarity", "nearest_other"]
TOP_N = 10


def ranks(values: np.ndarray) -> np.ndarray:
    """Average ranks, ties shared.

    Ratings are 1-5 over 60 images, so ties are the common case, not an edge
    case: ranking them arbitrarily would invent an ordering the rater never
    gave and quietly bias the correlation.
    """
    order = np.argsort(values, kind="stable")
    out = np.empty(len(values), dtype=float)
    out[order] = np.arange(len(values), dtype=float)
    for value in np.unique(values):
        tied = values == value
        out[tied] = out[tied].mean()
    return out


def spearman(a: np.ndarray, b: np.ndarray) -> float:
    """Rank correlation: monotonic agreement, no assumption of a straight line.

    A 1-5 rating is ordinal -- the gap between 4 and 5 is not necessarily the
    gap between 1 and 2 -- so correlating the raw numbers would read more into
    them than they carry.
    """
    if np.std(a) == 0 or np.std(b) == 0:
        return float("nan")  # a constant column has no correlation to report
    return float(np.corrcoef(ranks(a), ranks(b))[0, 1])


def main() -> None:
    scores = json.loads(Path("scores.json").read_text())
    ratings = json.loads(Path("ratings.json").read_text())

    rated = [row for row in scores if row["file"] in ratings]
    human = np.array([ratings[row["file"]] for row in rated], dtype=float)
    average = float(human.mean())

    summary = []
    for metric in METRICS:
        values = np.array([row[metric] for row in rated], dtype=float)
        # nearest_other measures duplication, so less is better; flipping it
        # here keeps every row in the table reading "higher should be better".
        directed = -values if metric == "nearest_other" else values
        picked = human[np.argsort(-directed, kind="stable")[:TOP_N]]
        summary.append(
            {
                "metric": metric,
                "spearman": round(spearman(directed, human), 3),
                # The practical question behind the correlation: if this metric
                # picked the shortlist, would a human like the shortlist?
                "top_n_mean_rating": round(float(picked.mean()), 2),
            }
        )

    results = {
        "n_images": len(scores),
        "n_rated": len(rated),
        "top_n": TOP_N,
        "mean_rating": round(average, 2),
        "metrics": sorted(summary, key=lambda r: -r["top_n_mean_rating"]),
        "images": [{**row, "rating": ratings.get(row["file"])} for row in scores],
    }
    Path("web/public/results.json").write_text(json.dumps(results, indent=2))
    print(json.dumps({k: v for k, v in results.items() if k != "images"}, indent=2))


if __name__ == "__main__":
    main()
