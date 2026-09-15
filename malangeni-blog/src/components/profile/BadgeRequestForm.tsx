"use client";

import { useEffect, useState } from "react";
import { api, ApiError, AUTH_ENDPOINTS } from "@/lib/api";
import { useAuth } from "@/lib/auth/AuthContext";
import type { BadgeRequest, BadgeRequestInput } from "@/lib/auth/types";
import { BusinessFields, businessPayload, emptyBusiness } from "./BusinessFields";

/**
 * "Request business badge" — how a member asks to be recognised as a local
 * business, formal or informal.
 *
 * Members can never award themselves a badge, so this only records a request; a
 * moderator confirms it out in the real world (a call or a visit) and approves
 * it afterwards. The questions below are all things a shop tells its customers
 * anyway. We ask for no ID numbers, no documents and no bank details: none of
 * that helps prove a shop is real, and all of it would hurt to leak.
 */
export function BadgeRequestForm() {
  const { profile, refreshProfile } = useAuth();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<BadgeRequestInput>(() =>
    emptyBusiness(profile?.accountType === "BUSINESS_FORMAL" ? "FORMAL" : "INFORMAL"),
  );
  const [rejectionNote, setRejectionNote] = useState<string | null>(null);

  const status = profile?.badgeRequestStatus ?? null;
  const hasBadge = profile?.badge === "BUSINESS";

  // A rejection is only useful with the moderator's reason, which lives on the
  // request itself rather than on the profile.
  useEffect(() => {
    if (status !== "REJECTED" && status !== "REVOKED") return;
    let cancelled = false;
    void (async () => {
      try {
        const mine = await api.get<BadgeRequest[]>(AUTH_ENDPOINTS.myBadgeRequests);
        if (!cancelled) {
          setRejectionNote(
            (status === "REVOKED" ? mine[0]?.revokeNote : mine[0]?.reviewNote) ?? null,
          );
        }
      } catch {
        /* the generic rejection message still shows */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status]);

  // Already recognised — nothing to ask for.
  if (hasBadge) {
    return (
      <Card>
        <Heading>Business badge</Heading>
        <p className="mt-2 text-[13px] text-muted">
          Your business is confirmed and the badge shows on your posts. If
          anything changes — you move, close, or change your number — let a
          moderator know so it stays accurate.
        </p>
      </Card>
    );
  }

  if (status === "PENDING") {
    return (
      <Card>
        <Heading>Business badge</Heading>
        <p className="mt-2 text-[13px] text-muted">
          Your request is with the moderators. They&apos;ll confirm your details
          — usually a quick call or a visit to the shop — and the badge appears
          once they have. No need to send anything else.
        </p>
      </Card>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post(AUTH_ENDPOINTS.badgeRequests, businessPayload(form));
      // The status lives on the profile, so re-read it rather than guessing.
      await refreshProfile();
      setOpen(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError("You already have a request waiting to be reviewed.");
      } else {
        setError(
          err instanceof Error ? err.message : "Could not send your request.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <Heading>Business badge</Heading>
      <p className="mt-2 text-[13px] text-muted">
        Run a shop, salon, taxi or any local service — registered or not? Ask to
        have it recognised so people can find you.
      </p>

      {status === "REVOKED" && (
        <p className="mt-3 rounded-lg border border-line bg-paper px-3.5 py-2.5 text-[13px] text-muted">
          Your business badge was removed by the hub team
          {rejectionNote ? (
            <>
              : <span className="text-ink">{rejectionNote}</span>
            </>
          ) : (
            "."
          )}{" "}
          If your business is still running, you can ask again with up-to-date
          details.
        </p>
      )}

      {status === "REJECTED" && (
        <p className="mt-3 rounded-lg border border-line bg-paper px-3.5 py-2.5 text-[13px] text-muted">
          Your last request wasn&apos;t confirmed
          {rejectionNote ? (
            <>
              : <span className="text-ink">{rejectionNote}</span>
            </>
          ) : (
            "."
          )}{" "}
          You can send another with up-to-date details.
        </p>
      )}

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-4 cursor-pointer rounded-lg bg-accent px-4 py-2.5 text-[13px] font-semibold text-white transition hover:opacity-95"
        >
          Request business badge
        </button>
      ) : (
        <form onSubmit={(e) => void onSubmit(e)} className="mt-4">
          {error && (
            <p
              role="alert"
              className="mb-4 rounded-lg border border-accent bg-accent-soft px-3.5 py-2.5 text-[13px] text-accent"
            >
              {error}
            </p>
          )}

          <BusinessFields value={form} onChange={setForm} typeSelectable />

          <PrivacyNote />

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="cursor-pointer rounded-lg bg-accent px-4 py-2.5 text-[13px] font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Sending…" : "Send request"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="cursor-pointer rounded-lg border border-line px-4 py-2.5 text-[13px] font-semibold text-ink transition hover:border-ink"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </Card>
  );
}

export function PrivacyNote() {
  return (
    <p className="mb-4 rounded-lg border border-line bg-paper px-3.5 py-2.5 text-[12.5px] leading-relaxed text-muted">
      A moderator will confirm these details with you — usually a call or a
      visit to the shop — and the badge appears once they have.{" "}
      <strong className="font-semibold text-ink">
        We never ask for your ID number, ID copy or bank details.
      </strong>{" "}
      Nobody from the hub will ever request them.
    </p>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="mt-5 rounded-card border border-line bg-card p-6">
      {children}
    </section>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return <h2 className="font-serif text-[20px] font-semibold">{children}</h2>;
}
