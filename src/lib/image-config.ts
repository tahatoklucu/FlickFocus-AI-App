/** Responsive `sizes` hints aligned to our poster grid layouts. */
export const POSTER_SIZES = {
  /** Homepage / favorites grid: 2 → 3 → 4 → 5 columns. */
  card: "(max-width: 640px) 160px, (max-width: 768px) 200px, (max-width: 1024px) 220px, 200px",
  /** Chat search results: 2–3 column compact grid. */
  chatThumb: "(max-width: 640px) 140px, 120px",
  /** Chat detail card poster column. */
  chatDetail: "140px",
  /** Movie detail modal hero poster. */
  modal: "270px",
} as const;

export const POSTER_QUALITY = {
  card: 70,
  detail: 75,
  decorative: 50,
} as const;
