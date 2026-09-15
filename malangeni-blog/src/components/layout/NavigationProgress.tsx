"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/** Give up on a navigation that never lands (blocked, or went nowhere). */
const GIVE_UP_MS = 15_000;

/**
 * A thin accent bar across the top that starts the moment an internal link is
 * clicked and finishes when the new page renders — so a slow page never feels
 * like a dead click. Driven straight on the DOM: no re-renders while it runs.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const bar = useRef<HTMLDivElement>(null);
  const running = useRef(false);
  const giveUp = useRef<number | undefined>(undefined);

  const finish = useCallback(() => {
    const el = bar.current;
    window.clearTimeout(giveUp.current);
    if (!el || !running.current) return;
    running.current = false;
    el.style.transition = "width 200ms ease-out, opacity 300ms ease 200ms";
    el.style.width = "100%";
    el.style.opacity = "0";
  }, []);

  // Start on a click that will change the page.
  useEffect(() => {
    function start() {
      const el = bar.current;
      if (!el) return;
      running.current = true;
      el.style.transition = "none";
      el.style.width = "0%";
      el.style.opacity = "1";
      void el.offsetWidth; // restart from zero before animating
      // Quick at first, then creeping, so it never looks finished before it is.
      el.style.transition = "width 8s cubic-bezier(0.1, 0.7, 0.2, 1)";
      el.style.width = "85%";
      window.clearTimeout(giveUp.current);
      giveUp.current = window.setTimeout(finish, GIVE_UP_MS);
    }

    function onClick(e: MouseEvent) {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.("a");
      if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // Same page (a #section link, or the page you're on): nothing loads.
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      start();
    }

    // Capture phase: Next's <Link> cancels the click's default before it bubbles.
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.clearTimeout(giveUp.current);
    };
  }, [finish]);

  // The new page has rendered.
  useEffect(() => {
    finish();
  }, [pathname, finish]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[2.5px]">
      <div ref={bar} className="h-full w-0 bg-accent opacity-0 shadow-[0_0_8px_var(--color-accent)]" />
    </div>
  );
}
