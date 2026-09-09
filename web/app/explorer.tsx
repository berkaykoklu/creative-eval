"use client";

import { useState } from "react";
import { CONFIGS, type Config, type Results, type Shot } from "@/lib/metrics";

function rank(images: Shot[], config: Config | null): Shot[] {
  if (!config) return images;
  const { key, direction } = config;
  return [...images].sort((a, b) => (Number(b[key]) - Number(a[key])) * direction);
}

/** Mean rating of the leading `topN` under this ordering. Every image was rated,
 *  so there is nothing to skip; the guard is for a future partial run. */
function meanOfTop(ordered: Shot[], topN: number): number {
  const rated = ordered.slice(0, topN).filter((s) => s.rating !== null);
  if (rated.length === 0) return 0;
  return rated.reduce((sum, s) => sum + (s.rating as number), 0) / rated.length;
}

export default function Explorer({ results }: { results: Results }) {
  const [selected, setSelected] = useState<string | null>(null);
  const { images, top_n, mean_rating } = results;

  const config = CONFIGS.find((c) => c.key === selected) ?? null;
  // Correlation comes from results.json, not from a second calculation here:
  // the page must never be able to disagree with what analyze.py computed.
  const rho = [...results.metrics, results.control].find(
    (m) => m.metric === config?.key,
  )?.spearman;
  const ordered = rank(images, config);
  const score = config ? meanOfTop(ordered, top_n) : mean_rating;
  const delta = score - mean_rating;

  const verdict = !config
    ? `All ${images.length} creatives, unsorted. I rated every one of them 1–5 without seeing any of the scores. The average is ${mean_rating.toFixed(2)} — that is the number any filter has to beat.`
    : config.isControl
      ? `This is the control, and it beats every real metric. It runs the same arithmetic as button-area clarity on a region with no button — so the button-area metric was never detecting ad-placement suitability. It was detecting a calm image, and the mobile-ads rationale was a story told after the numbers arrived.`
      : delta > 0.3
        ? `Ranking by ${config.label.toLowerCase()} lifts the top ${top_n} to ${score.toFixed(2)} against ${mean_rating.toFixed(2)} unfiltered. This filter is worth running.`
        : delta > 0
          ? `A lift of ${delta.toFixed(2)} over ${mean_rating.toFixed(2)}. Barely better than not filtering at all.`
          : `The top ${top_n} average ${score.toFixed(2)} — worse than picking at random. Filtering on ${config.label.toLowerCase()} actively hurts.`;

  return (
    <div className="try">
      <div className="tabs" role="group" aria-label="Rank the creatives by a metric">
        <button
          className="tab"
          aria-pressed={selected === null}
          onClick={() => setSelected(null)}
        >
          No filter
        </button>
        {CONFIGS.map((c) => (
          <button
            key={c.key}
            className="tab"
            aria-pressed={selected === c.key}
            onClick={() => setSelected(c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="readout">
        <div className="stat">
          <span className={`n ${config ? (delta > 0 ? "up" : "down") : ""}`}>
            {score.toFixed(2)}
          </span>
          <span className="k">{config ? `Top ${top_n} rating` : "All 60, unfiltered"}</span>
        </div>
        {config && (
          <div className="stat">
            <span className={`n ${delta > 0 ? "up" : "down"}`}>
              {delta >= 0 ? "+" : ""}
              {delta.toFixed(2)}
            </span>
            <span className="k">vs no filter</span>
          </div>
        )}
        {config && rho !== undefined && (
          <div className="stat">
            <span className="n">{rho.toFixed(2)}</span>
            <span className="k">Rank correlation</span>
          </div>
        )}
      </div>

      <p className="verdict">{verdict}</p>

      <div className="gallery">
        {ordered.map((shot, i) => (
          <figure
            key={shot.file}
            className={`shot ${config ? (i < top_n ? "pick" : "dim") : ""}`}
            style={{ margin: 0 }}
          >
            <img src={`/images/${shot.file}`} alt={shot.text} loading="lazy" />
            <figcaption className="r">{shot.rating ?? "—"}</figcaption>
          </figure>
        ))}
      </div>

      <p style={{ fontSize: ".82rem", color: "var(--muted)" }}>
        The number on each thumbnail is my rating, 1–5. Highlighted images are the
        top {top_n} under the current ranking.
      </p>
    </div>
  );
}
