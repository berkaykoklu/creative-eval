/** Metric metadata, shared by the server-rendered page and the client explorer.
 *  Every number these describe was computed in Python; nothing is recalculated
 *  in the browser, so the page cannot disagree with the repository. */

export type Metric = { metric: string; spearman: number; top_n_mean_rating: number };

export type Shot = {
  file: string;
  text: string;
  adherence: number;
  brand_colour: number;
  cta_clarity: number;
  control_clarity: number;
  nearest_other: number;
  rating: number | null;
};

export type Results = {
  n_images: number;
  n_rated: number;
  top_n: number;
  mean_rating: number;
  metrics: Metric[];
  control: Metric;
  images: Shot[];
};

export type Config = {
  key: keyof Shot;
  label: string;
  short: string;
  /** -1 where a lower raw value is the better creative, so every metric in the
   *  UI reads "higher is better" regardless of how it is stored. */
  direction: 1 | -1;
  blurb: string;
  isControl?: boolean;
};

export const CONFIGS: Config[] = [
  {
    key: "cta_clarity",
    label: "Button-area clarity",
    short: "CTA",
    direction: 1,
    blurb:
      "How uncluttered the bottom-centre strip is. Mobile ads put the install button there, so a busy strip makes a creative unusable however good the rest looks. Five lines of arithmetic over pixels.",
  },
  {
    key: "adherence",
    label: "Prompt adherence",
    short: "CLIP",
    direction: 1,
    blurb:
      "How closely the image matches the prompt that produced it, measured by CLIP — a 600 MB model trained on 400 million image-caption pairs. Catches an image that is attractive but off-brief.",
  },
  {
    key: "brand_colour",
    label: "Brand colour",
    short: "Colour",
    direction: 1,
    blurb:
      "Share of pixels close to the brand palette. Plain arithmetic, no model.",
  },
  {
    key: "nearest_other",
    label: "Distinctiveness",
    short: "Distinct",
    direction: -1,
    blurb:
      "How far an image sits from every other image. Sixty renders from one brief are not sixty ideas — this asks how many are actually different.",
  },
  {
    key: "control_clarity",
    label: "Top-strip clarity (control)",
    short: "Control",
    direction: 1,
    blurb:
      "The identical arithmetic as button-area clarity, run on the top strip — where there is no button and no story to justify it. It exists only to test whether the button-area metric measures what it claims.",
    isControl: true,
  },
];
