"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { safeNext } from "@/lib/users";

/**
 * The whole sign-in screen. Google is the only provider, and the backend
 * account is created automatically on first use — so there is no password
 * field, no sign-up form and nothing to fill in.
 */
export function SignInPanel() {
  const { firebaseUser, profile, loading, error, signIn, refreshProfile } =
    useAuth();
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);
  const [popupError, setPopupError] = useState<string | null>(null);

  // Fully signed in (Firebase session *and* backend profile) → back to where they were headed.
  useEffect(() => {
    if (firebaseUser && profile) {
      router.replace(safeNext(new URLSearchParams(window.location.search).get("next")));
    }
  }, [firebaseUser, profile, router]);

  async function onSignIn() {
    setPopupError(null);
    setSubmitting(true);
    try {
      await signIn();
    } catch (err) {
      setPopupError(
        err instanceof Error
          ? err.message
          : "Sign-in failed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  // Signed in to Google, but the backend account could not be read. Don't
  // pretend they're signed out — offer a retry instead.
  const backendUnreachable = !!firebaseUser && !profile && !loading && !!error;

  return (
    <div className="mx-auto w-full max-w-[420px] py-14">
      <div className="mb-6 text-center">
        <span className="text-[11px] font-semibold uppercase tracking-[1.5px] text-gold">
          Welcome
        </span>
        <h1 className="mt-1.5 font-serif text-[34px] font-semibold tracking-[-0.5px]">
          Sign in
        </h1>
        <p className="mt-1 text-[14px] text-muted">
          Sign in to post, join groups and list your services.
        </p>
      </div>

      <div className="rounded-card border border-line bg-card p-6">
        {popupError && (
          <p
            role="alert"
            className="mb-4 rounded-lg border border-accent bg-accent-soft px-3.5 py-2.5 text-[13px] text-accent"
          >
            {popupError}
          </p>
        )}

        {backendUnreachable ? (
          <>
            <p
              role="alert"
              className="mb-4 rounded-lg border border-accent bg-accent-soft px-3.5 py-2.5 text-[13px] text-accent"
            >
              Signed in as {firebaseUser?.email}, but we couldn&apos;t load your
              account: {error}
            </p>
            <button
              type="button"
              onClick={() => void refreshProfile()}
              className="w-full cursor-pointer rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95"
            >
              Try again
            </button>
          </>
        ) : (
          <>
            {/*
              Deliberately not disabled while `loading`. That flag is true on
              every page load until Firebase restores the session, which would
              leave the only call to action dead on arrival — and dead for good
              if the SDK can't reach its storage. Opening the popup is safe
              regardless of whether the session has resolved yet.
            */}
            <button
              type="button"
              onClick={() => void onSignIn()}
              disabled={submitting}
              className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-lg border border-line bg-paper px-4 py-3 text-sm font-semibold text-ink transition hover:border-ink disabled:cursor-not-allowed disabled:opacity-60"
            >
              <GoogleMark />
              {submitting ? "Signing in…" : "Continue with Google"}
            </button>

            <p className="mt-4 text-center text-[12.5px] leading-relaxed text-muted">
              First time here? Signing in creates your Malangeni Hub account
              automatically — there&apos;s nothing else to fill in.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

/** Google's four-colour "G", inline so it needs no network request. */
function GoogleMark() {
  return (
    <svg className="size-[18px] shrink-0" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M45.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11.8c-.5 2.7-2 5-4.4 6.6v5.5h7.1c4.2-3.8 6.6-9.5 6.6-16.1z"
      />
      <path
        fill="#34A853"
        d="M24 46c6 0 11-2 14.5-5.4l-7.1-5.5c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.6-3.9-12.3-9.1H4.3v5.7C7.8 41 15.3 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.7 28.1c-.4-1.3-.7-2.7-.7-4.1s.2-2.8.7-4.1v-5.7H4.3C2.8 17.2 2 20.5 2 24s.8 6.8 2.3 9.8l7.4-5.7z"
      />
      <path
        fill="#EA4335"
        d="M24 10.8c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.9 4.2 30 2 24 2 15.3 2 7.8 7 4.3 14.2l7.4 5.7c1.7-5.2 6.6-9.1 12.3-9.1z"
      />
    </svg>
  );
}
