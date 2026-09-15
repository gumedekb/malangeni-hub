"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import Link from "next/link";

/** Catches anything that throws while rendering a page; the header and footer stay. */
export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto w-full max-w-[520px] px-5 py-20 text-center">
      <p className="font-serif text-[44px] font-semibold leading-none text-accent">Oops</p>
      <h1 className="mt-4 font-serif text-[26px] font-semibold">Something went wrong on this page</h1>
      <p className="mt-2 text-[14.5px] text-muted">
        Try again — if it keeps happening, let the hub team know.
      </p>
      {error.digest && <p className="mt-2 text-[12px] text-muted">Reference: {error.digest}</p>}
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={() => unstable_retry()}
          className="cursor-pointer rounded-lg bg-accent px-4 py-2.5 text-[13px] font-semibold text-white transition hover:opacity-95"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-lg border border-line px-4 py-2.5 text-[13px] font-semibold text-ink transition hover:border-ink"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
