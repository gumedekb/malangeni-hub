import Link from "next/link";
import { Container } from "@/components/layout/Container";

/** 404 for unknown routes and for anything that calls `notFound()`. */
export default function NotFound() {
  return (
    <Container as="main">
      <section className="mx-auto max-w-[520px] py-20 text-center">
        <p className="font-serif text-[64px] font-semibold leading-none text-accent">404</p>
        <h1 className="mt-4 font-serif text-[28px] font-semibold">We couldn&apos;t find that page</h1>
        <p className="mt-2 text-[14.5px] text-muted">
          It may have been moved or deleted, or the link has a typo.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link
            href="/"
            className="rounded-lg bg-accent px-4 py-2.5 text-[13px] font-semibold text-white transition hover:opacity-95"
          >
            Go home
          </Link>
          <Link
            href="/community"
            className="rounded-lg border border-line px-4 py-2.5 text-[13px] font-semibold text-ink transition hover:border-ink"
          >
            Community
          </Link>
        </div>
      </section>
    </Container>
  );
}
