import { useCallback, useRef, useState } from "react";

const SCROLL_THRESHOLD_PX = 80;

export function useChatAutoScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isPinnedToBottomRef = useRef(true);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const checkIsAtBottom = useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      return true;
    }

    return (
      container.scrollHeight - container.scrollTop - container.clientHeight <
      SCROLL_THRESHOLD_PX
    );
  }, []);

  const syncScrollPin = useCallback(() => {
    const atBottom = checkIsAtBottom();
    isPinnedToBottomRef.current = atBottom;
    setIsAtBottom(atBottom);
  }, [checkIsAtBottom]);

  const handleScroll = useCallback(() => {
    const atBottom = checkIsAtBottom();
    isPinnedToBottomRef.current = atBottom;
    setIsAtBottom(atBottom);
  }, [checkIsAtBottom]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    isPinnedToBottomRef.current = true;
    setIsAtBottom(true);

    container.scrollTo({
      top: container.scrollHeight,
      behavior,
    });

    // Content may still be growing during streaming — confirm pin after paint.
    requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: behavior === "smooth" ? "auto" : behavior,
      });
      syncScrollPin();
    });
  }, [syncScrollPin]);

  const pinToBottom = useCallback(() => {
    isPinnedToBottomRef.current = true;
    setIsAtBottom(true);
  }, []);

  const followStream = useCallback(
    (behavior: ScrollBehavior = "auto") => {
      if (isPinnedToBottomRef.current) {
        const container = containerRef.current;
        if (!container) {
          return;
        }

        container.scrollTo({
          top: container.scrollHeight,
          behavior,
        });
        syncScrollPin();
      }
    },
    [syncScrollPin],
  );

  return {
    containerRef,
    handleScroll,
    scrollToBottom,
    pinToBottom,
    followStream,
    syncScrollPin,
    isAtBottom,
    isPinnedToBottomRef,
  };
}
