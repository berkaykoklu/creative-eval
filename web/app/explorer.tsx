"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { CONFIGS, type Config, type Results, type Shot } from "@/lib/metrics";

function rank(images: Shot[], config: Config | null): Shot[] {
  if (!config) return images;
  const { key, direction } = config;
  return [...images].sort((a, b) => (Number(b[key]) - Number(a[key])) * direction);
}

function meanOfTop(ordered: Shot[], topN: number): number {
  const rated = ordered.slice(0, topN).filter((s) => s.rating !== null);
  if (rated.length === 0) return 0;
  return rated.reduce((sum, s) => sum + (s.rating as number), 0) / rated.length;
}

export default function Explorer({ results }: { results: Results }) {
  const [selected, setSelected] = useState<string | null>(null);
  const still = useReducedMotion();
  const { images, top_n, mean_rating } = results;

  const config = CONFIGS.find((c) => c.key === selected) ?? null;
  // Correlation comes from results.json rather than a second calculation here:
  // the page must never be able to disagree with what analyze.py computed.
  const rho = [...results.metrics, results.control].find((m) => m.metric === config?.key)?.spearman;
  const ordered = rank(images, config);
  const score = config ? meanOfTop(ordered, top_n) : mean_rating;
  const delta = score - mean_rating;

  const verdict = !config
    ? `All ${images.length} creatives, unsorted. I rated every one of them 1–5 without seeing any of the scores. The average is ${mean_rating.toFixed(2)} — the number any filter has to beat.`
    : config.isControl
      ? "This is the control, and it beats every real filter. It runs the same arithmetic as button-area clarity on a region with no button — so that filter was never detecting ad-placement suitability. It was detecting a calm image, and the rationale was written after the numbers arrived."
      : delta > 0.3
        ? `Ranking by ${config.label.toLowerCase()} lifts the top ${top_n} to ${score.toFixed(2)} against ${mean_rating.toFixed(2)} unfiltered. Worth running.`
        : delta > 0
          ? `A lift of ${delta.toFixed(2)} over ${mean_rating.toFixed(2)}. Barely better than not filtering at all.`
          : `The top ${top_n} average ${score.toFixed(2)} — worse than picking at random. Filtering on ${config.label.toLowerCase()} actively hurts.`;

  return (
    <div className="lift rounded-[14px] p-5 sm:p-7">
      <div className="mb-5 flex flex-wrap gap-1.5" role="group" aria-label="Rank the creatives by a metric">
        <button
          type="button"
          aria-pressed={selected === null}
          onClick={() => setSelected(null)}
          className={`rounded-md border px-3 py-1.5 text-[0.82rem] transition-colors ${
            selected === null
              ? "border-flow/50 bg-flow/10 font-medium text-hi"
              : "border-line bg-raised text-low hover:text-mid"
          }`}
        >
          No filter
        </button>
        {CONFIGS.map((c) => (
          <button
            key={c.key}
            type="button"
            aria-pressed={selected === c.key}
            onClick={() => setSelected(c.key)}
            className={`rounded-md border px-3 py-1.5 text-[0.82rem] transition-colors ${
              selected === c.key
                ? c.isControl
                  ? "border-block/50 bg-block/10 font-medium text-hi"
                  : "border-flow/50 bg-flow/10 font-medium text-hi"
                : "border-line bg-raised text-low hover:text-mid"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-baseline gap-x-10 gap-y-4">
        <div>
          <motion.p
            key={score}
            initial={still ? false : { opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="display text-[clamp(2.4rem,7vw,3.6rem)] tnum"
            style={{ color: config ? (delta > 0 ? "var(--color-ok)" : "var(--color-block)") : "var(--color-hi)" }}
          >
            {score.toFixed(2)}
          </motion.p>
          <p className="label mt-1">{config ? `TOP ${top_n} RATING` : "ALL 60, UNFILTERED"}</p>
        </div>
        {config && (
          <div>
            <p className="display text-[clamp(1.6rem,4.5vw,2.2rem)] tnum"
               style={{ color: delta > 0 ? "var(--color-ok)" : "var(--color-block)" }}>
              {delta >= 0 ? "+" : ""}{delta.toFixed(2)}
            </p>
            <p className="label mt-1">VS NO FILTER</p>
          </div>
        )}
        {config && rho !== undefined && (
          <div>
            <p className="display text-[clamp(1.6rem,4.5vw,2.2rem)] tnum">{rho.toFixed(2)}</p>
            <p className="label mt-1">RANK CORRELATION</p>
          </div>
        )}
      </div>

      <p className="mb-5 min-h-[3.4rem] max-w-[68ch] text-[0.9rem] leading-relaxed text-mid">
        {verdict}
      </p>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(76px,1fr))] gap-1.5">
        {ordered.map((shot, i) => (
          <figure
            key={shot.file}
            className={`relative m-0 aspect-square overflow-hidden rounded-md border transition-all duration-300 ${
              config
                ? i < top_n
                  ? "border-flow"
                  : "border-line opacity-25"
                : "border-line"
            }`}
          >
            <img src={`/images/${shot.file}`} alt={shot.text} loading="lazy"
                 className="h-full w-full object-cover" />
            <figcaption className="absolute bottom-0.5 right-0.5 rounded bg-base/85 px-1 py-0.5 font-mono text-[0.6rem] leading-none text-hi">
              {shot.rating ?? "—"}
            </figcaption>
          </figure>
        ))}
      </div>

      <p className="mt-3 font-mono text-[0.72rem] text-low">
        NUMBER ON EACH THUMBNAIL IS MY RATING · HIGHLIGHTED ARE THE TOP {top_n}
      </p>
    </div>
  );
}
