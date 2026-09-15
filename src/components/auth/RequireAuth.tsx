"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { canModerate, isAdmin } from "@/lib/auth/types";
import { loginHref } from "@/lib/users";
import { Forbidden } from "./Forbidden";

/**
 * One guard for every signed-in page. Signed-out visitors go to sign in and
 * come back here afterwards; signed-in members without the role see the 403
 * screen. Hiding a page is a convenience — the backend enforces every rule.
 */
export function RequireAuth({
  children,
  role,
}: {
  children: React.ReactNode;
  /** Leave out for "any signed-in member". */
  role?: "staff" | "admin";
}) {
  const { firebaseUser, profile, loading, error, refreshProfile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const signedOut = !loading && !firebaseUser;

  useEffect(() => {
    if (signedOut) router.replace(loginHref(pathname));
  }, [signedOut, pathname, router]);

  if (signedOut) return <Note>Taking you to sign in…</Note>;

  if (!profile) {
    if (loading || !error) return <Note>Loading…</Note>;
    return (
      <Note>
        We couldn&apos;t load your account: {error}{" "}
        <button
          type="button"
          onClick={() => void refreshProfile()}
          className="cursor-pointer font-semibold text-accent"
        >
          Try again
        </button>
      </Note>
    );
  }

  if (role === "staff" && !canModerate(profile)) return <Forbidden />;
  if (role === "admin" && !isAdmin(profile)) {
    return <Forbidden message="This page is for administrators." />;
  }

  return <>{children}</>;
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="py-14 text-center text-[14px] text-muted">{children}</p>;
}
