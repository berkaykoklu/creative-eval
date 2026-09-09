import raw from "../public/results.json";

/** Mirrors what analyze.py writes. The only place the frontend restates
 *  something Python already knows, and it is shape only -- every number here
 *  was computed and rounded on the Python side. */
type Metric = { metric: string; spearman: number; top_n_mean_rating: number };

type Results = {
  n_images: number;
  n_rated: number;
  top_n: number;
  mean_rating: number;
  metrics: Metric[];
  control: Metric;
  images: {
    file: string;
    text: string;
    subject: string;
    style: string;
    seed: number;
    adherence: number;
    brand_colour: number;
    cta_clarity: number;
    control_clarity: number;
    nearest_other: number;
    rating: number | null;
  }[];
};

const results = raw as Results;

const LABELS: Record<string, string> = {
  adherence: "CLIP adherence",
  brand_colour: "Brand colour",
  cta_clarity: "CTA clarity",
  nearest_other: "Distinctiveness",
  control_clarity: "Top-strip flatness (control)",
};

const EXPLAINS: Record<string, string> = {
  adherence: "Cosine similarity between the image and its own prompt in CLIP's shared embedding space. Catches an image that is attractive but off-brief.",
  brand_colour: "Share of pixels within a fixed RGB distance of the brand palette. Plain arithmetic, no model.",
  cta_clarity: "How flat the bottom-centre strip is. Mobile ads put the install button there, so a busy strip makes a creative unusable however good it looks.",
  nearest_other: "Inverted nearest-neighbour similarity across all 60 images. Sixty renders are not sixty ideas; this says how many are actually distinct.",
  control_clarity: "The same arithmetic as CTA clarity, run on the top strip instead — a region with no install button and no story attached. It exists to test whether the CTA metric measures what it claims.",
};

/** Bar chart, hand-drawn in SVG.
 *  A chart library would be one more dependency and one more thing whose
 *  internals I could not explain; four bars and a baseline is arithmetic. */
function Chart({ metrics, baseline, control }:
               { metrics: Metric[]; baseline: number; control: string }) {
  const width = 640, rowHeight = 46, padLeft = 130, padRight = 56, top = 24;
  const height = top + metrics.length * rowHeight + 28;
  const scale = (value: number) => ((width - padLeft - padRight) * value) / 5;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" role="img"
         aria-label="Mean human rating of each metric's top ten selection">
      {[1, 2, 3, 4, 5].map((tick) => (
        <g key={tick}>
          <line x1={padLeft + scale(tick)} x2={padLeft + scale(tick)} y1={top - 8}
                y2={height - 28} stroke="var(--grid)" />
          <text x={padLeft + scale(tick)} y={height - 12} fontSize="10"
                fill="var(--muted)" textAnchor="middle">{tick}</text>
        </g>
      ))}

      {metrics.map((row, i) => {
        const y = top + i * rowHeight;
        const beatsBaseline = row.top_n_mean_rating > baseline;
        const isControl = row.metric === control;
        return (
          <g key={row.metric}>
            <text x={padLeft - 10} y={y + 15} fontSize="12" fill="var(--text)" textAnchor="end">
              {LABELS[row.metric] ?? row.metric}
            </text>
            <rect x={padLeft} y={y} width={Math.max(scale(row.top_n_mean_rating), 1)} height="20"
                  rx="2" fill={beatsBaseline ? "var(--good)" : "var(--muted)"}
                  opacity={isControl ? 0.45 : 0.85}
                  stroke={isControl ? "var(--accent)" : "none"} strokeDasharray="3 2" />
            <text x={padLeft + scale(row.top_n_mean_rating) + 6} y={y + 15} fontSize="11"
                  fill="var(--muted)">{row.top_n_mean_rating.toFixed(2)}</text>
          </g>
        );
      })}

      {/* Everything is read against this line: a metric that cannot beat the
          average of all sixty images is not selecting anything. */}
      <line x1={padLeft + scale(baseline)} x2={padLeft + scale(baseline)} y1={top - 8}
            y2={height - 28} stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="4 3" />
      <text x={padLeft + scale(baseline)} y={top - 12} fontSize="10" fill="var(--accent)"
            textAnchor="middle">no-filter average {baseline.toFixed(2)}</text>
    </svg>
  );
}

export default function Home() {
  const { metrics, control, mean_rating, top_n, n_images, n_rated, images } = results;
  const best = metrics[0];
  const lift = best ? best.top_n_mean_rating - mean_rating : 0;
  const ranked = [...images].sort((a, b) => b.adherence - a.adherence);

  return (
    <>
      <h1>Which AI-generated ad creatives are actually any good?</h1>
      <p className="lede">
        Generating {n_images} mobile-game ad creatives takes one script and no
        money. Deciding which ones are worth a media budget is the real problem.
        I scored all {n_images} automatically, rated them by eye, and measured
        whether the scores agree with the eye.
      </p>

      {best && (
        <div className="finding">
          <p>
            <strong>Finding.</strong> The best of the four is{" "}
            <b>{LABELS[best.metric] ?? best.metric}</b> at ρ ={" "}
            <b>{best.spearman.toFixed(2)}</b>: its top {top_n} average{" "}
            <b>{best.top_n_mean_rating.toFixed(2)}</b> against{" "}
            <b>{mean_rating.toFixed(2)}</b> unfiltered, a lift of{" "}
            <b>{lift >= 0 ? "+" : ""}{lift.toFixed(2)}</b>. It is five lines of
            arithmetic over pixels, and it beat the 600&nbsp;MB CLIP model.
          </p>
          <p style={{ margin: 0 }}>
            <strong>And then the control beat them both.</strong> CTA clarity
            came with a tidy story — mobile ads put the install button in the
            bottom centre, so a busy strip there makes a creative unusable. So I
            ran the identical arithmetic on the <b>top</b> strip, where there is
            no button and no story. It scored ρ ={" "}
            <b>{control.spearman.toFixed(2)}</b>, with a top-{top_n} average of{" "}
            <b>{control.top_n_mean_rating.toFixed(2)}</b> — better on both. The
            metric was never detecting ad-placement suitability. It was detecting
            a visually calm image, and my domain rationale was a story told after
            the fact.
          </p>
        </div>
      )}

      <h2>Does each metric pick what a human picks?</h2>
      <p className="note">
        Bars show the mean rating I gave to each metric&rsquo;s top {top_n}. The
        dashed line is the mean over all {n_rated} rated images — the score a
        metric must beat to be worth running at all. The outlined bar is the
        control, not a candidate filter.
      </p>
      <div className="chart">
        <Chart metrics={[...metrics, control]} baseline={mean_rating} control={control.metric} />
      </div>

      <table>
        <thead>
          <tr><th>Metric</th><th>Spearman ρ</th><th>Top {top_n} rating</th><th>vs baseline</th></tr>
        </thead>
        <tbody>
          {[...metrics, control].map((row) => {
            const delta = row.top_n_mean_rating - mean_rating;
            return (
              <tr key={row.metric}>
                <td>{LABELS[row.metric] ?? row.metric}</td>
                <td className="num">{row.spearman.toFixed(2)}</td>
                <td className="num">{row.top_n_mean_rating.toFixed(2)}</td>
                <td className={`num ${delta > 0 ? "win" : ""}`}>
                  {delta >= 0 ? "+" : ""}{delta.toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <h2>What each metric measures</h2>
      <dl>
        {[...metrics, control].map((row) => (
          <div key={row.metric} style={{ marginBottom: "0.9rem" }}>
            <dt style={{ fontWeight: 600 }}>{LABELS[row.metric] ?? row.metric}</dt>
            <dd style={{ margin: "0.2rem 0 0", color: "var(--muted)", fontSize: "0.92rem" }}>
              {EXPLAINS[row.metric]}
            </dd>
          </div>
        ))}
      </dl>
      <p className="note">
        Three of the four are arithmetic over pixels; one is a small CLIP model.
        No language model judges anything here — whether an image matches its
        prompt or leaves the button area clear is measurable, and measuring beats
        asking.
      </p>

      <h2>All {n_images} creatives</h2>
      <p className="note">
        Ranked by CLIP adherence. <code>R</code> is my rating, <code>A</code>{" "}
        adherence, <code>C</code> CTA clarity.
      </p>
      <div className="grid">
        {ranked.map((image) => (
          <figure className="card" key={image.file} style={{ margin: 0 }}>
            <img src={`/images/${image.file}`} alt={image.text} loading="lazy" />
            <figcaption className="meta">
              R <b>{image.rating ?? "—"}</b> · A <b>{image.adherence.toFixed(2)}</b> · C{" "}
              <b>{image.cta_clarity.toFixed(2)}</b>
            </figcaption>
          </figure>
        ))}
      </div>
    </>
  );
}
