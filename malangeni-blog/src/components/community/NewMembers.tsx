"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api, MEMBER_ENDPOINTS } from "@/lib/api";
import { useAuth } from "@/lib/auth/AuthContext";
import { loginHref, nameOf, profileHref } from "@/lib/users";
import type { RecentMembers } from "@/lib/types";
import { Avatar } from "@/components/ui/Avatar";

/** The newest members and how many joined this week. Signed-in only, like profiles. */
export function NewMembers() {
  const { profile, loading } = useAuth();
  const pathname = usePathname();
  const viewerId = profile ? String(profile.id) : null;

  // Tagged with the viewer, so a sign-out or account switch never shows stale data.
  const [data, setData] = useState<{ viewer: string; recent: RecentMembers } | null>(null);
  const [failedFor, setFailedFor] = useState<string | null>(null);

  useEffect(() => {
    if (!viewerId) return;
    let cancelled = false;
    void (async () => {
      try {
        const recent = await api.get<RecentMembers>(MEMBER_ENDPOINTS.recent(8));
        if (!cancelled) setData({ viewer: viewerId, recent });
      } catch {
        if (!cancelled) setFailedFor(viewerId);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [viewerId]);

  const recent = data && data.viewer === viewerId ? data.recent : null;

  let body: React.ReactNode;
  if (!profile) {
    body = loading ? (
      <p className="text-[13px] text-muted">Loading…</p>
    ) : (
      <p className="text-[13px] text-muted">
        <Link href={loginHref(pathname)} className="font-semibold text-accent">
          Sign in
        </Link>{" "}
        to see who&apos;s joined.
      </p>
    );
  } else if (!recent) {
    body = (
      <p className="text-[13px] text-muted">
        {failedFor === viewerId ? "Couldn't load new members." : "Loading…"}
      </p>
    );
  } else if (recent.members.length === 0) {
    body = <p className="text-[13px] text-muted">No members yet.</p>;
  } else {
    body = (
      <>
        <div className="flex items-center">
          {recent.members.map((member) => (
            <Link
              key={member.id}
              href={profileHref(member.username)}
              title={nameOf(member)}
              className="relative -ml-2 rounded-full border-2 border-card transition first:ml-0 hover:z-10 hover:scale-110"
            >
              <Avatar src={member.avatarUrl} name={nameOf(member)} size={32} />
            </Link>
          ))}
        </div>
        <p className="mt-2.5 text-[13px] text-muted">
          {recent.joinedThisWeek} joined this week
        </p>
      </>
    );
  }

  return (
    <div className="rounded-xl border border-line bg-card p-[18px]">
      <h4 className="mb-3 font-serif text-base font-semibold">New members</h4>
      {body}
    </div>
  );
}
