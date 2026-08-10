import type { GenreChipId } from "@/constants/genreChips";

/** Popular OMDb catalog picks per genre (fetched by IMDb ID, then verified by genre metadata). */
export const GENRE_MOVIE_CANDIDATES: Record<GenreChipId, readonly string[]> = {
  "sci-fi": [
    "tt1375666", // Inception
    "tt0816692", // Interstellar
    "tt0133093", // The Matrix
    "tt0062622", // 2001: A Space Odyssey
    "tt0088763", // Back to the Future
    "tt0107290", // Jurassic Park
    "tt0076759", // Star Wars
    "tt0103064", // Terminator 2: Judgment Day
    "tt0083658", // Blade Runner
    "tt0499549", // Avatar
    "tt0088247", // The Terminator
    "tt0083866", // E.T. the Extra-Terrestrial
    "tt0118884", // Contact
    "tt0482571", // The Prestige
  ],
  action: [
    "tt0468569", // The Dark Knight
    "tt0172495", // Gladiator
    "tt4154796", // Avengers: Endgame
    "tt0848228", // The Avengers
    "tt2911666", // John Wick
    "tt0120737", // The Lord of the Rings: The Fellowship of the Ring
    "tt0103064", // Terminator 2: Judgment Day
    "tt0076759", // Star Wars
    "tt1375666", // Inception
    "tt0499549", // Avatar
    "tt0167260", // The Lord of the Rings: The Return of the King
    "tt0133093", // The Matrix
    "tt0816464", // Mission: Impossible - Fallout
    "tt0371746", // Iron Man
  ],
  drama: [
    "tt0111161", // The Shawshank Redemption
    "tt0109830", // Forrest Gump
    "tt0110912", // Pulp Fiction
    "tt0108052", // Schindler's List
    "tt0169547", // American Beauty
    "tt0118799", // Life Is Beautiful
    "tt0120586", // American History X
    "tt0114369", // Se7en
    "tt0468569", // The Dark Knight
    "tt0172495", // Gladiator
    "tt0816692", // Interstellar
    "tt0110413", // Leon: The Professional
    "tt0102926", // The Silence of the Lambs
    "tt0114814", // The Usual Suspects
  ],
  classics: [
    "tt0068646", // The Godfather
    "tt0111161", // The Shawshank Redemption
    "tt0109830", // Forrest Gump
    "tt0110912", // Pulp Fiction
    "tt0108052", // Schindler's List
    "tt0071562", // The Godfather Part II
    "tt0050083", // 12 Angry Men
    "tt0034583", // Casablanca
    "tt0060196", // The Good, the Bad and the Ugly
    "tt0102926", // The Silence of the Lambs
    "tt0062622", // 2001: A Space Odyssey
    "tt0076759", // Star Wars
    "tt0088763", // Back to the Future
    "tt0137523", // Fight Club
  ],
  epic: [
    "tt0120737", // The Lord of the Rings: The Fellowship of the Ring
    "tt0167261", // The Lord of the Rings: The Two Towers
    "tt0167260", // The Lord of the Rings: The Return of the King
    "tt0172495", // Gladiator
    "tt0816692", // Interstellar
    "tt4154796", // Avengers: Endgame
    "tt0076759", // Star Wars
    "tt0499549", // Avatar
    "tt0080684", // Star Wars: The Empire Strikes Back
    "tt0086190", // Star Wars: Return of the Jedi
    "tt0104326", // Dances with Wolves
    "tt0325980", // Pirates of the Caribbean: The Curse of the Black Pearl
    "tt0363771", // The Chronicles of Narnia: The Lion, the Witch and the Wardrobe
    "tt0120338", // Titanic
  ],
};

export const GENRE_MOVIE_LIMIT = 10;

export function isGenreChipId(value: string): value is GenreChipId {
  return value in GENRE_MOVIE_CANDIDATES;
}
