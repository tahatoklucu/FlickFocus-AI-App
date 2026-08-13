import { getImageProps } from "next/image";
import { POSTER_QUALITY, POSTER_SIZES } from "@/lib/image-config";
import { isValidPosterUrl } from "@/lib/poster/poster-url";
import type { FeaturedMovie } from "@/types";

const LCP_PRELOAD_COUNT = 5;

/**
 * Emit early preload hints for above-the-fold featured posters so LCP
 * is discoverable from the initial document (not only after hydration).
 */
export default function FeaturedPosterPreloads({
  movies,
}: {
  movies: FeaturedMovie[];
}) {
  return (
    <>
      {movies.slice(0, LCP_PRELOAD_COUNT).map((movie, index) => {
        if (!isValidPosterUrl(movie.Poster)) {
          return null;
        }

        const { props } = getImageProps({
          src: movie.Poster,
          alt: "",
          width: 200,
          height: 300,
          sizes: POSTER_SIZES.card,
          quality: POSTER_QUALITY.card,
          priority: true,
        });

        return (
          <link
            key={movie.imdbID}
            rel="preload"
            as="image"
            href={props.src}
            imageSrcSet={props.srcSet}
            imageSizes={props.sizes}
            fetchPriority={index === 0 ? "high" : "low"}
          />
        );
      })}
    </>
  );
}
