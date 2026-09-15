"use client"; // Error boundaries must be Client Components

import "./globals.css";

/** Last resort when the root layout itself fails; it replaces the whole page. */
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    // global-error must include html and body tags
    <html lang="en">
      <body className="font-sans leading-normal">
        <title>Something went wrong — Malangeni Hub</title>
        <main className="mx-auto w-full max-w-[520px] px-5 py-24 text-center">
          <p className="font-serif text-[44px] font-semibold leading-none text-accent">Oops</p>
          <h1 className="mt-4 font-serif text-[26px] font-semibold">Malangeni Hub hit a problem</h1>
          <p className="mt-2 text-[14.5px] text-muted">Try again in a moment.</p>
          {error.digest && <p className="mt-2 text-[12px] text-muted">Reference: {error.digest}</p>}
          <button
            type="button"
            onClick={() => unstable_retry()}
            className="mt-6 cursor-pointer rounded-lg bg-accent px-4 py-2.5 text-[13px] font-semibold text-white"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
