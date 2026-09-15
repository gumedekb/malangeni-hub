"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";

/**
 * Sends a signed-in member who hasn't yet said whether they're a member or a
 * business owner to `/welcome`. Renders nothing.
 *
 * `accountType` is null (absent from the JSON) until they answer, and the
 * question is asked exactly once — the backend refuses a second answer.
 */
export function OnboardingGate() {
  const { profile } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const needsOnboarding = !!profile && !profile.accountType;

  useEffect(() => {
    if (needsOnboarding && pathname !== "/welcome") router.replace("/welcome");
  }, [needsOnboarding, pathname, router]);

  return null;
}
