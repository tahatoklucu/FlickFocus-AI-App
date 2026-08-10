/** Client-safe OMDb exports (browser fetch via API routes + session cache). */
export {
  getMovieById,
  getGenreMovies,
  searchMovies,
  getOMDbErrorMessage,
  OMDbError,
} from "@/services/omdb.client";
