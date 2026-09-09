import raw from "../public/results.json";
import Explorer from "./explorer";
import { CONFIGS, type Results } from "@/lib/metrics";

const results = raw as Results;

const LABEL: Record<string, string> = Object.fromEntries(
  CONFIGS.map((c) => [c.key, c.label]),
);

export default function Home() {
  const { metrics, control, mean_rating, top_n, n_images } = results;
  const best = metrics[0];

  return (
    <>
      {/* ── 1. What this is, in one breath ───────────────────────────── */}
      <p className="eyebrow">Generative AI · Evaluation</p>
      <h1>Which AI ad creatives are worth a budget?</h1>
      <p className="deck">
        A model can generate sixty mobile-game ad creatives in ten minutes for
        nothing. Deciding which of them deserves real ad spend is the part a
        studio actually pays for. I built four automatic quality filters, rated
        every image by eye without seeing the scores, and measured whether the
        filters agree with the human — then added a control that proved my best
        filter was measuring the wrong thing.
      </p>

      {/* ── 2. Try it ────────────────────────────────────────────────── */}
      <h2>Try it</h2>
      <p>
        Pick a filter. The creatives re-rank instantly and the readout shows what
        I actually rated its top {top_n}. Every number is measured, not
        illustrative.
      </p>
      <Explorer results={results} />

      {/* ── 3. What runs behind it ───────────────────────────────────── */}
      <h2>What runs behind it</h2>
      <figure>
        <svg viewBox="0 0 720 232" role="img" aria-label="Generation, scoring and rating all run once on a laptop; their output is committed to the repository, and the deployed page only reads it.">
          <defs>
            <marker id="a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" fill="currentColor" />
            </marker>
            <marker id="b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" fill="var(--accent)" />
            </marker>
          </defs>

          <rect x="6" y="28" width="452" height="192" rx="6" fill="var(--sunk)" stroke="var(--rule)" />
          <text x="18" y="20" fontSize="10.5" fontFamily="IBM Plex Mono, monospace" fill="currentColor" opacity=".65">
            RUNS ONCE, ON A LAPTOP — no cloud, no API bill
          </text>

          <rect x="496" y="28" width="218" height="192" rx="6" fill="none" stroke="var(--accent)" strokeDasharray="4 3" />
          <text x="508" y="20" fontSize="10.5" fontFamily="IBM Plex Mono, monospace" fill="var(--accent)">
            RUNS ON EVERY VISIT
          </text>

          <g fontSize="11.5" fontFamily="IBM Plex Sans, sans-serif" textAnchor="middle" fill="currentColor">
            <rect x="24" y="48" width="104" height="38" rx="4" fill="var(--surface)" stroke="var(--rule)" />
            <text x="76" y="65">Creative brief</text>
            <text x="76" y="78" fontSize="9.5" opacity=".62">3 subjects × 4 styles</text>

            <line x1="128" y1="67" x2="160" y2="67" stroke="currentColor" markerEnd="url(#a)" />

            <rect x="162" y="48" width="118" height="38" rx="4" fill="var(--surface)" stroke="var(--rule)" />
            <text x="221" y="65">Stable Diffusion</text>
            <text x="221" y="78" fontSize="9.5" opacity=".62">open weights, on-device</text>

            <line x1="280" y1="67" x2="312" y2="67" stroke="currentColor" markerEnd="url(#a)" />

            <rect x="314" y="48" width="126" height="38" rx="4" fill="var(--surface)" stroke="var(--rule)" />
            <text x="377" y="65">60 creatives</text>
            <text x="377" y="78" fontSize="9.5" opacity=".62">fixed seeds, reproducible</text>

            <path d="M377 86 L377 100 L221 100 L221 116" fill="none" stroke="currentColor" markerEnd="url(#a)" />
            <path d="M377 86 L377 100 L76 100 L76 116" fill="none" stroke="currentColor" markerEnd="url(#a)" />

            <rect x="20" y="118" width="112" height="42" rx="4" fill="var(--surface)" stroke="var(--rule)" />
            <text x="76" y="135">Human rating</text>
            <text x="76" y="149" fontSize="9.5" opacity=".62">blind to the scores</text>

            <rect x="164" y="118" width="114" height="42" rx="4" fill="var(--surface)" stroke="var(--rule)" />
            <text x="221" y="135">4 metrics</text>
            <text x="221" y="149" fontSize="9.5" opacity=".62">CLIP + arithmetic</text>

            <rect x="310" y="118" width="130" height="42" rx="4" fill="var(--surface)" stroke="var(--accent)" />
            <text x="375" y="135" fill="var(--accent)">Calibration</text>
            <text x="375" y="149" fontSize="9.5" opacity=".7">before any rating exists</text>
            <line x1="310" y1="139" x2="282" y2="139" stroke="var(--accent)" markerEnd="url(#b)" />

            <path d="M76 160 L76 176 L221 176 L221 186" fill="none" stroke="currentColor" markerEnd="url(#a)" />
            <path d="M221 160 L221 186" fill="none" stroke="currentColor" markerEnd="url(#a)" />

            <rect x="152" y="188" width="138" height="24" rx="4" fill="var(--surface)" stroke="var(--rule)" />
            <text x="221" y="204">Agreement analysis</text>

            <path d="M290 200 L360 200 L360 152 L560 152 L560 128" fill="none" stroke="var(--accent)" strokeWidth="1.4" markerEnd="url(#b)" />
            <text x="452" y="145" fontSize="9.5" fill="var(--accent)" fontFamily="IBM Plex Mono, monospace">committed to git</text>

            <rect x="512" y="86" width="96" height="40" rx="4" fill="var(--surface)" stroke="var(--rule)" />
            <text x="560" y="104">Results</text>
            <text x="560" y="117" fontSize="9.5" opacity=".62">+ 60 images</text>

            <line x1="560" y1="126" x2="560" y2="152" stroke="currentColor" markerEnd="url(#a)" />

            <rect x="504" y="154" width="112" height="40" rx="4" fill="var(--surface)" stroke="var(--rule)" />
            <text x="560" y="172">This page</text>
            <text x="560" y="185" fontSize="9.5" opacity=".62">static, no server</text>

            <text x="640" y="108" fontSize="9.5" fill="var(--accent)" fontFamily="IBM Plex Mono, monospace" textAnchor="start">$0</text>
            <text x="640" y="121" fontSize="9.5" opacity=".6" textAnchor="start">per visit</text>
          </g>
        </svg>
        <figcaption>
          Nothing inside the grey area runs when you load this page. The model,
          the scoring and my ratings all happen once on a laptop; only the
          results cross into the deployment, which is why the site costs nothing
          to serve and every figure on it can be reproduced.
        </figcaption>
      </figure>

      {/* ── 4. How it works, plainly ─────────────────────────────────── */}
      <h2>How the filters work</h2>
      <p>
        Three of the four are arithmetic over pixels. One is a small vision
        model. <strong>No language model judges anything</strong> — whether an
        image matches its prompt is measurable, and measuring beats asking.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: ".9rem" }}>
        {CONFIGS.map((c) => (
          <div key={c.key}>
            <h3 style={{ margin: 0, color: c.isControl ? "var(--bad)" : undefined }}>
              {c.label}
            </h3>
            <p style={{ color: "var(--muted)", fontSize: ".95rem" }}>{c.blurb}</p>
          </div>
        ))}
      </div>

      {/* ── 5. What came out ─────────────────────────────────────────── */}
      <h2>What came out</h2>
      <div className="scroll">
        <table>
          <thead>
            <tr>
              <th>Filter</th>
              <th>Rank correlation</th>
              <th>Top {top_n} rating</th>
              <th>vs no filter</th>
            </tr>
          </thead>
          <tbody>
            {[...metrics, control].map((row) => {
              const delta = row.top_n_mean_rating - mean_rating;
              const isControl = row.metric === control.metric;
              return (
                <tr key={row.metric} className={isControl ? "ctrl" : undefined}>
                  <td>{LABEL[row.metric] ?? row.metric}</td>
                  <td>{row.spearman.toFixed(2)}</td>
                  <td>{row.top_n_mean_rating.toFixed(2)}</td>
                  <td className={delta > 0 ? "pos" : "neg"}>
                    {delta >= 0 ? "+" : ""}
                    {delta.toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h3>Five lines of arithmetic beat a 600 MB model</h3>
      <p>
        {LABEL[best?.metric ?? ""]} is a standard deviation over a rectangle of
        pixels. CLIP is a transformer trained on 400 million image-caption
        pairs. On this set the arithmetic predicted my judgement roughly three
        times better.
      </p>

      <h3>Filtering for distinctiveness actively hurts</h3>
      <p>
        The ten creatives furthest from every other creative averaged{" "}
        <strong>1.70</strong> against a baseline of {mean_rating.toFixed(2)}. In
        a batch of generations, an outlier is usually a failure rather than an
        idea.
      </p>

      <div className="panel lead">
        <h3 style={{ margin: 0 }}>And then the control beat them both</h3>
        <p>
          Button-area clarity came with a tidy rationale: mobile ads put the
          install button in the bottom centre, so a busy strip there makes a
          creative unusable. So I ran the identical arithmetic on the{" "}
          <em>top</em> strip, where there is no button and no story. It scored{" "}
          <strong>{control.spearman.toFixed(2)}</strong> against{" "}
          {best?.spearman.toFixed(2)} — better on every measure.
        </p>
        <p>
          The metric was detecting a visually calm image all along. My domain
          rationale was written after the numbers arrived, and without a control
          it would have shipped as a finding.
        </p>
      </div>

      {/* ── 6. Built with ────────────────────────────────────────────── */}
      <h2>Built with</h2>
      <div className="chips">
        <span className="chip"><b>Python</b></span>
        <span className="chip"><b>PyTorch</b> Apple Silicon / MPS</span>
        <span className="chip"><b>Diffusers</b> Stable Diffusion Turbo</span>
        <span className="chip"><b>CLIP</b> image-text embeddings</span>
        <span className="chip"><b>NumPy</b></span>
        <span className="chip"><b>Next.js</b> static, no server</span>
        <span className="chip"><b>pytest</b> · ruff</span>
      </div>
      <p style={{ fontSize: ".92rem", color: "var(--muted)" }}>
        {n_images} creatives generated on-device with open weights, so the whole
        project cost nothing to run and needs no API key to reproduce.
      </p>

      {/* ── 7. What this does not prove ──────────────────────────────── */}
      <h2>What this does not prove</h2>
      <ul>
        <li>
          <strong>One rater.</strong> This measures whether these filters track{" "}
          <em>my</em> judgement on <em>this</em> brief. A second rater would give
          an inter-rater agreement figure that this cannot.
        </li>
        <li>
          <strong>Sixty images is a small sample.</strong> At this size a
          correlation of 0.2 is hard to separate from nothing, so the ordering of
          the weak filters should not be over-read.
        </li>
        <li>
          <strong>The ratings are skewed</strong> — 26 of 60 scored 1. Much of
          what the good filters detect may be the difference between broken and
          coherent rather than between good and better.
        </li>
        <li>
          <strong>The brand palette was never put in the prompt</strong>, so that
          filter measures whether the colours turned up by chance rather than
          whether the model followed an instruction.
        </li>
      </ul>

      <p className="foot">
        Code, data and every figure on this page:{" "}
        <a href="https://github.com/berkaykoklu/creative-eval">
          github.com/berkaykoklu/creative-eval
        </a>
      </p>
    </>
  );
}
