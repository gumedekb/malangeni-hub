"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { absoluteUrl, SHARE_TARGETS } from "@/lib/share";

const noSubscribe = () => () => {};

/**
 * Share a page to WhatsApp, Facebook, X, Telegram or email, or copy its link.
 * Where the browser has a system share sheet (most phones), it's offered too.
 */
export function ShareButton({
  path,
  title,
  className = "",
}: {
  /** Site path of the thing being shared, e.g. `/community/abc`. */
  path: string;
  /** Used as the message text and email subject. */
  title: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  // False on the server, so the extra option only appears once we know the browser.
  const canNativeShare = useSyncExternalStore(
    noSubscribe,
    () => typeof navigator.share === "function",
    () => false,
  );

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function copyLink() {
    const url = absoluteUrl(path);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (older browser, no permission) — let them copy it by hand.
      window.prompt("Copy this link:", url);
    }
  }

  async function shareNatively() {
    setOpen(false);
    try {
      await navigator.share({ title, text: title, url: absoluteUrl(path) });
    } catch {
      /* closed the share sheet — nothing to do */
    }
  }

  const itemClass =
    "flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2 text-left transition hover:bg-paper";

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex cursor-pointer items-center gap-1 transition hover:text-ink"
      >
        <svg
          className="size-[15px]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
        </svg>
        Share
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Share"
          className="absolute right-0 top-[calc(100%+8px)] z-30 w-52 overflow-hidden rounded-xl border border-line bg-card py-1 text-[13.5px] text-ink shadow-[0_12px_32px_rgba(0,0,0,0.14)]"
        >
          {SHARE_TARGETS.map((target) => (
            <a
              key={target.id}
              role="menuitem"
              href={target.href(absoluteUrl(path), title)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className={itemClass}
            >
              <span
                aria-hidden="true"
                className="grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white"
                style={{ background: target.color }}
              >
                {target.mark}
              </span>
              {target.label}
            </a>
          ))}
          <button type="button" role="menuitem" onClick={() => void copyLink()} className={itemClass}>
            <span aria-hidden="true" className="grid size-6 shrink-0 place-items-center rounded-full bg-paper text-[12px]">
              🔗
            </span>
            {copied ? "Link copied" : "Copy link"}
          </button>
          {canNativeShare && (
            <button
              type="button"
              role="menuitem"
              onClick={() => void shareNatively()}
              className={`${itemClass} border-t border-line`}
            >
              <span aria-hidden="true" className="grid size-6 shrink-0 place-items-center rounded-full bg-paper text-[12px]">
                ⋯
              </span>
              More options
            </button>
          )}
        </div>
      )}
    </div>
  );
}
