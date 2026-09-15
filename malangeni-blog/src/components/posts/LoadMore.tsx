"use client";

import { useEffect, useRef } from "react";

/**
 * Infinite scroll: loads the next page as the end of the list comes into view.
 * The button is there too, for keyboards and browsers without
 * IntersectionObserver.
 */
export function LoadMore({
  hasMore,
  loading,
  onLoadMore,
}: {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Re-armed after every load, so a short page that leaves the end still in view keeps going.
  useEffect(() => {
    const el = ref.current;
    if (!el || !hasMore || loading || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) onLoadMore();
      },
      { rootMargin: "400px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore]);

  if (!hasMore) return null;

  return (
    <div ref={ref} className="col-span-full py-4 text-center">
      <button
        type="button"
        onClick={onLoadMore}
        disabled={loading}
        className="cursor-pointer rounded-full border border-line bg-card px-5 py-2 text-[13px] font-semibold text-ink transition hover:border-ink disabled:cursor-wait disabled:opacity-60"
      >
        {loading ? "Loading…" : "Load more"}
      </button>
    </div>
  );
}
