export const GENRE_CHIPS = [
  { id: "classics", label: "Classics" },
  { id: "sci-fi", label: "Sci-Fi" },
  { id: "action", label: "Action" },
  { id: "drama", label: "Drama" },
  { id: "epic", label: "Epic" },
] as const;

export type GenreChipId = (typeof GENRE_CHIPS)[number]["id"];

export function getGenreChipLabel(genreId: GenreChipId): string {
  return GENRE_CHIPS.find((chip) => chip.id === genreId)?.label ?? genreId;
}
