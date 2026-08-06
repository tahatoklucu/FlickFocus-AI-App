/** Client-safe OMDb exports (browser fetch via API routes + session cache). */
export {
  getMovieById,
  searchMovies,
  getOMDbErrorMessage,
  OMDbError,
} from "@/services/omdb.client";
