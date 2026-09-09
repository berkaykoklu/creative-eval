"""Rate each image 1-5 by eye. Writes ratings.json; resumable.

This is the human half of the experiment, and it has to happen blind of the
automatic scores -- seeing them first would make the correlation in analyze.py
measure how suggestible the rater was.
"""

import json
import subprocess
from pathlib import Path

RATINGS = Path("ratings.json")
QUESTION = "1-5 (would you run this as an ad?), or 'q' to stop: "


def main() -> None:
    index = json.loads(Path("index.json").read_text())
    done: dict[str, int] = json.loads(RATINGS.read_text()) if RATINGS.exists() else {}

    for row in index:
        if row["file"] in done:
            continue
        subprocess.run(["open", str(Path("web/public/images") / row["file"])], check=True)
        print(f"\n[{len(done) + 1}/{len(index)}] {row['file']}\n  {row['text']}")

        while True:
            answer = input(QUESTION).strip()
            if answer == "q":
                RATINGS.write_text(json.dumps(done, indent=2))
                print(f"saved {len(done)}")
                return
            if answer in {"1", "2", "3", "4", "5"}:
                done[row["file"]] = int(answer)
                # Written every time, not at the end: a crash 55 images in
                # should not cost 55 judgements.
                RATINGS.write_text(json.dumps(done, indent=2))
                break

    print(f"all {len(done)} rated")


if __name__ == "__main__":
    main()
