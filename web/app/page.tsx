import raw from "../public/results.json";
import Explorer from "./explorer";
import Reveal from "@/components/Reveal";
import { CONFIGS, type Results } from "@/lib/metrics";

const results = raw as Results;
const REPO = "https://github.com/berkaykoklu/creative-eval";
const HOME = "https://berkaykoklu.vercel.app";
const LABEL: Record<string, string> = Object.fromEntries(CONFIGS.map((c) => [c.key, c.label]));

export default function Home() {
  const { metrics, control, mean_rating, top_n, n_images } = results;
  const best = metrics[0]!;

  return (
    <main className="relative z-10 mx-auto w-full max-w-[72rem] px-6 py-16 sm:py-24">
      <Reveal>
        <a href={HOME} className="font-mono text-[0.76rem] text-low transition-colors hover:text-mid">
          ← berkaykoklu.vercel.app
        </a>
        <h1 className="display mt-6 text-[clamp(2.3rem,6.5vw,4.2rem)]">
          Which AI ad creatives<br />are worth a budget?
        </h1>
        <p className="mt-6 max-w-[62ch] text-[1.05rem] leading-relaxed text-mid">
          A model generates {n_images} mobile-game ad creatives in ten minutes
          for nothing. Deciding which of them deserves real ad spend is the part
          a studio actually pays for. I built four automatic quality filters,
          rated every image by eye without seeing the scores, and measured
          whether the filters agree with the human — then added a control that
          proved my best filter was measuring the wrong thing.
        </p>
      </Reveal>

      <section className="mt-16 sm:mt-24">
        <Reveal>
          <h2 className="display text-[clamp(1.6rem,4vw,2.3rem)]">Try it</h2>
          <p className="mt-3 max-w-[60ch] text-mid">
            Pick a filter. The creatives re-rank instantly and the readout shows
            what I actually rated its top {top_n}. Every number is measured.
          </p>
        </Reveal>
        <div className="mt-8"><Reveal><Explorer results={results} /></Reveal></div>
      </section>

      <section className="mt-20 sm:mt-28">
        <Reveal>
          <h2 className="display text-[clamp(1.6rem,4vw,2.3rem)]">What each filter measures</h2>
          <p className="mt-3 max-w-[64ch] text-mid">
            Three are arithmetic over pixels. One is a small vision model.{" "}
            <span className="text-hi">No language model judges anything</span> —
            whether an image matches its prompt is measurable, and measuring
            beats asking.
          </p>
        </Reveal>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {CONFIGS.map((c, i) => (
            <Reveal key={c.key} delay={i * 0.04}>
              <div className={`lift h-full rounded-[14px] p-5 ${c.isControl ? "border border-block/30" : ""}`}>
                <h3 className="text-[1rem] font-semibold"
                    style={c.isControl ? { color: "var(--color-block)" } : undefined}>
                  {c.label}
                </h3>
                <p className="mt-2 text-[0.89rem] leading-relaxed text-mid">{c.blurb}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mt-20 sm:mt-28">
        <Reveal>
          <h2 className="display text-[clamp(1.6rem,4vw,2.3rem)]">What came out</h2>
        </Reveal>
        <Reveal delay={0.05}>
          <div className="lift mt-8 overflow-hidden rounded-[14px]">
            <table className="w-full text-[0.9rem]">
              <thead>
                <tr className="border-b border-line">
                  {["Filter", "Rank correlation", `Top ${top_n} rating`, "vs no filter"].map((h, i) => (
                    <th key={h} className={`px-5 py-3 font-mono text-[0.68rem] font-medium text-low ${i ? "text-right" : "text-left"}`}>
                      {h.toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...metrics, control].map((row) => {
                  const delta = row.top_n_mean_rating - mean_rating;
                  const isControl = row.metric === control.metric;
                  return (
                    <tr key={row.metric} className="border-b border-line last:border-0"
                        style={isControl ? { color: "var(--color-block)" } : undefined}>
                      <td className="px-5 py-3">{LABEL[row.metric] ?? row.metric}</td>
                      <td className="px-5 py-3 text-right tnum">{row.spearman.toFixed(2)}</td>
                      <td className="px-5 py-3 text-right tnum">{row.top_n_mean_rating.toFixed(2)}</td>
                      <td className="px-5 py-3 text-right tnum"
                          style={{ color: isControl ? undefined : delta > 0 ? "var(--color-ok)" : "var(--color-block)" }}>
                        {delta >= 0 ? "+" : ""}{delta.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Reveal>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Reveal delay={0.08}>
            <div className="lift h-full rounded-[14px] p-5 sm:p-6">
              <h3 className="text-[1rem] font-semibold">Five lines of arithmetic beat a 600 MB model</h3>
              <p className="mt-2 text-[0.9rem] leading-relaxed text-mid">
                {LABEL[best.metric]} is a standard deviation over a rectangle of
                pixels. CLIP is a transformer trained on 400 million image-caption
                pairs. On this set the arithmetic predicted my judgement roughly
                three times better.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.12}>
            <div className="lift h-full rounded-[14px] p-5 sm:p-6">
              <h3 className="text-[1rem] font-semibold">Filtering for distinctiveness actively hurts</h3>
              <p className="mt-2 text-[0.9rem] leading-relaxed text-mid">
                The ten creatives furthest from every other creative averaged{" "}
                <span className="font-mono text-hi">1.70</span> against a baseline
                of {mean_rating.toFixed(2)}. In a batch of generations, an outlier
                is usually a failure rather than an idea.
              </p>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.16}>
          <div className="mt-4 rounded-[14px] border border-block/35 bg-block/[0.06] p-5 sm:p-7">
            <p className="label mb-2" style={{ color: "var(--color-block)" }}>
              AND THEN THE CONTROL BEAT THEM BOTH
            </p>
            <p className="max-w-[66ch] text-[0.98rem] leading-relaxed text-hi">
              Button-area clarity came with a tidy rationale: mobile ads put the
              install button in the bottom centre, so a busy strip there makes a
              creative unusable. So I ran the identical arithmetic on the{" "}
              <em>top</em> strip, where there is no button and no story. It scored{" "}
              <span className="font-mono tnum">{control.spearman.toFixed(2)}</span>{" "}
              against <span className="font-mono tnum">{best.spearman.toFixed(2)}</span> — better
              on every measure. The filter was detecting a visually calm image all
              along. My rationale was written after the numbers arrived, and
              without a control it would have shipped as a finding.
            </p>
          </div>
        </Reveal>
      </section>

      <section className="mt-20 sm:mt-28">
        <Reveal>
          <h2 className="display text-[clamp(1.6rem,4vw,2.3rem)]">What this does not prove</h2>
          <ul className="mt-6 max-w-[66ch] space-y-3 text-[0.94rem] leading-relaxed text-mid">
            <li>
              <span className="font-semibold text-hi">One rater.</span> This
              measures whether these filters track <em>my</em> judgement on{" "}
              <em>this</em> brief. A second rater would give an inter-rater
              agreement figure that this cannot.
            </li>
            <li>
              <span className="font-semibold text-hi">Sixty images is a small sample.</span>{" "}
              At this size a correlation of 0.2 is hard to separate from nothing,
              so the ordering of the weak filters should not be over-read.
            </li>
            <li>
              <span className="font-semibold text-hi">The ratings are skewed</span> —
              26 of 60 scored 1. Much of what the good filters detect may be the
              difference between broken and coherent rather than good and better.
            </li>
            <li>
              <span className="font-semibold text-hi">The brand palette was never put in the prompt</span>,
              so that filter measures whether the colours turned up by chance
              rather than whether the model followed an instruction.
            </li>
          </ul>
        </Reveal>
      </section>

      <footer className="mt-20 border-t border-line pt-8 text-[0.84rem] text-low sm:mt-28">
        <a href={REPO} className="transition-colors hover:text-mid">
          Code, data and every figure on this page — github.com/berkaykoklu/creative-eval
        </a>
      </footer>
    </main>
  );
}
