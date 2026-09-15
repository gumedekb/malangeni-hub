"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, AUTH_ENDPOINTS } from "@/lib/api";
import { useAuth } from "@/lib/auth/AuthContext";
import type { AccountType, BadgeRequestInput } from "@/lib/auth/types";
import {
  BusinessFields,
  businessPayload,
  emptyBusiness,
} from "@/components/profile/BusinessFields";
import { PrivacyNote } from "@/components/profile/BadgeRequestForm";

const OPTIONS: { value: AccountType; title: string; body: string }[] = [
  {
    value: "MEMBER",
    title: "I'm a community member",
    body: "Read the news, post, join groups and find local services.",
  },
  {
    value: "BUSINESS_INFORMAL",
    title: "I run an informal business",
    body: "Spaza shop, salon, taxi, street stall, home business — anything not registered.",
  },
  {
    value: "BUSINESS_FORMAL",
    title: "I run a registered business",
    body: "A company or close corporation registered with CIPC or similar.",
  },
];

/**
 * The one-time "who are you?" step after first sign-in.
 *
 * Choosing a business sends the details straight to the moderators' list. It
 * grants nothing by itself: the business badge only appears once a moderator
 * has confirmed the business is real.
 */
export function WelcomePanel() {
  const { firebaseUser, profile, loading, error: authError, refreshProfile } =
    useAuth();
  const router = useRouter();
  const [choice, setChoice] = useState<AccountType | null>(null);
  const [business, setBusiness] = useState<BadgeRequestInput>(() =>
    emptyBusiness("INFORMAL"),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const answered = !!profile?.accountType;

  useEffect(() => {
    if (loading) return;
    if (!firebaseUser) router.replace("/login");
    else if (answered) router.replace("/");
  }, [loading, firebaseUser, answered, router]);

  if (!profile || answered) {
    return (
      <p className="py-14 text-center text-[14px] text-muted">
        {authError ?? "Loading…"}
      </p>
    );
  }

  const isBusiness = choice !== null && choice !== "MEMBER";

  function pick(value: AccountType) {
    setChoice(value);
    if (value !== "MEMBER") {
      setBusiness((b) => ({
        ...b,
        businessType: value === "BUSINESS_FORMAL" ? "FORMAL" : "INFORMAL",
      }));
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!choice) return;
    setError(null);
    setSubmitting(true);
    try {
      await api.post(AUTH_ENDPOINTS.onboarding, {
        accountType: choice,
        business: isBusiness ? businessPayload(business) : undefined,
      });
      await refreshProfile();
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your answer.");
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={(e) => void onSubmit(e)}
      className="w-full max-w-[560px] pb-16"
    >
      {error && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-accent bg-accent-soft px-3.5 py-2.5 text-[13px] text-accent"
        >
          {error}
        </p>
      )}

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-[14px] text-muted">
          This helps us show you the right things. You only answer once.
        </legend>
        {OPTIONS.map((o) => {
          const selected = choice === o.value;
          return (
            <label
              key={o.value}
              className={`flex cursor-pointer gap-3 rounded-card border bg-card p-4 transition ${
                selected ? "border-accent" : "border-line hover:border-ink"
              }`}
            >
              <input
                type="radio"
                name="accountType"
                value={o.value}
                checked={selected}
                onChange={() => pick(o.value)}
                className="mt-1 accent-[var(--color-accent)]"
              />
              <span>
                <span className="block text-[15px] font-semibold">{o.title}</span>
                <span className="mt-0.5 block text-[13px] text-muted">
                  {o.body}
                </span>
              </span>
            </label>
          );
        })}
      </fieldset>

      {isBusiness && (
        <section className="mt-5 rounded-card border border-line bg-card p-6">
          <h2 className="mb-4 font-serif text-[20px] font-semibold">
            About your business
          </h2>
          <BusinessFields
            value={business}
            onChange={setBusiness}
            typeSelectable={false}
          />
          <PrivacyNote />
        </section>
      )}

      <button
        type="submit"
        disabled={!choice || submitting}
        className="mt-5 cursor-pointer rounded-lg bg-accent px-5 py-3 text-[14px] font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting
          ? "Saving…"
          : isBusiness
            ? "Continue and send for verification"
            : "Continue"}
      </button>
    </form>
  );
}
