"use client";

import { useCallback, useEffect, useState } from "react";
import {
  buildHomeSearchQuery,
  EMPTY_HOME_SEARCH_STATE,
  isSameHomeSearchState,
  parseHomeSearchParams,
  type HomeSearchState,
} from "@/lib/home-search-params";

interface NavigateOptions {
  /** Overwrite the current entry instead of adding one to the back stack. */
  replace?: boolean;
}

type NavigateFn = (next: HomeSearchState, options?: NavigateOptions) => void;

/**
 * Keeps discovery state (query, page, genre) in the address bar using the
 * History API, so searches are shareable and the back button works.
 *
 * State starts empty and hydrates after mount on purpose: the home page is
 * prerendered with the featured list, and reading the URL during render would
 * force it to become dynamic.
 */
export function useHomeSearchUrlState(): readonly [HomeSearchState, NavigateFn] {
  const [state, setState] = useState<HomeSearchState>(EMPTY_HOME_SEARCH_STATE);

  useEffect(() => {
    function syncFromUrl() {
      const fromUrl = parseHomeSearchParams(window.location.search);
      setState((current) =>
        isSameHomeSearchState(current, fromUrl) ? current : fromUrl,
      );
    }

    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, []);

  const navigate = useCallback<NavigateFn>((next, options = {}) => {
    setState((current) => (isSameHomeSearchState(current, next) ? current : next));

    const url = `${window.location.pathname}${buildHomeSearchQuery(next)}`;
    const isCurrentUrl = url === `${window.location.pathname}${window.location.search}`;

    if (options.replace || isCurrentUrl) {
      window.history.replaceState(null, "", url);
    } else {
      window.history.pushState(null, "", url);
    }
  }, []);

  return [state, navigate] as const;
}
