import Link from "next/link";

/** The 403 screen: signed in, but this page isn't for them. */
export function Forbidden({
  message = "This page is for the hub team.",
}: {
  message?: string;
}) {
  return (
    <section className="mx-auto max-w-[520px] py-16 text-center">
      <p className="font-serif text-[56px] font-semibold leading-none text-accent">403</p>
      <h2 className="mt-4 font-serif text-[24px] font-semibold">You don&apos;t have access to this page</h2>
      <p className="mt-2 text-[14.5px] text-muted">{message}</p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-lg bg-accent px-4 py-2.5 text-[13px] font-semibold text-white transition hover:opacity-95"
      >
        Go home
      </Link>
    </section>
  );
}
