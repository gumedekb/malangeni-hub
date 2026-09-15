"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Page } from "@/lib/types";

/** Shared building blocks for the hub-team tabs. */

/** Fetches `url`, re-fetching whenever `url` or `reload` changes. */
export function useFetch<T>(url: string, reload: number) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const result = await api.get<T>(url);
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load this list.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url, reload]);

  return { data, error };
}

export function usePage<T>(url: string, reload: number) {
  const { data, error } = useFetch<Page<T>>(url, reload);
  return { page: data, error };
}

export function formatDate(iso?: string | null, withTime = false) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

export function MemberLink({ user }: { user?: { username: string } | null }) {
  if (!user) return <span className="text-muted">—</span>;
  return (
    <Link href={`/u/${encodeURIComponent(user.username)}`} className="font-semibold text-accent">
      {user.username}
    </Link>
  );
}

export function Table({
  head,
  minWidth,
  children,
}: {
  head: string[];
  minWidth: number;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-card border border-line bg-card">
      <table className="w-full text-left text-[13.5px]" style={{ minWidth }}>
        <thead className="border-b border-line text-[12px] uppercase tracking-[0.5px] text-muted">
          <tr>
            {head.map((h, i) => (
              <th key={i} className="px-4 py-3 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Pager<T>({ page, onPage }: { page: Page<T>; onPage: (n: number) => void }) {
  if (page.totalPages <= 1) return null;
  return (
    <div className="mt-4 flex items-center gap-3 text-[13px]">
      <button
        type="button"
        disabled={page.first}
        onClick={() => onPage(page.number - 1)}
        className="cursor-pointer rounded-lg border border-line px-3 py-1.5 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
      >
        Previous
      </button>
      <span className="text-muted">
        Page {page.number + 1} of {page.totalPages}
      </span>
      <button
        type="button"
        disabled={page.last}
        onClick={() => onPage(page.number + 1)}
        className="cursor-pointer rounded-lg border border-line px-3 py-1.5 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}

export function TabButton({
  active,
  onClick,
  small,
  children,
}: {
  active: boolean;
  onClick: () => void;
  small?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`cursor-pointer rounded-full border font-semibold transition ${
        small ? "px-3 py-1 text-[12.5px]" : "px-4 py-2 text-[13px]"
      } ${
        active
          ? "border-accent bg-accent text-white"
          : "border-line bg-card text-ink hover:border-ink"
      }`}
    >
      {children}
    </button>
  );
}

export function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11.5px] font-semibold uppercase tracking-[0.5px] text-muted">
        {label}
      </dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}

export function Note({ children }: { children: React.ReactNode }) {
  return <p className="py-10 text-[14px] text-muted">{children}</p>;
}

export const INPUT_CLASS =
  "w-full rounded-[10px] border border-line bg-paper px-4 py-3 text-[14px] outline-none transition focus:border-accent";

export const PRIMARY_BUTTON =
  "cursor-pointer rounded-lg bg-accent px-4 py-2.5 text-[13px] font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60";

export const SECONDARY_BUTTON =
  "cursor-pointer rounded-lg border border-line px-3 py-1.5 text-[12.5px] font-semibold text-ink transition hover:border-ink disabled:cursor-not-allowed disabled:opacity-60";

export function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-medium">
      {children}
    </label>
  );
}

export function FormCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 rounded-card border border-line bg-card p-6">
      <h3 className="mb-4 font-serif text-[18px] font-semibold">{title}</h3>
      {children}
    </section>
  );
}

export function ErrorLine({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="mb-4 rounded-lg border border-accent bg-accent-soft px-3.5 py-2.5 text-[13px] text-accent"
    >
      {children}
    </p>
  );
}
