"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, COMMUNITY_ENDPOINTS } from "@/lib/api";
import { useAuth } from "@/lib/auth/AuthContext";
import { canModerate } from "@/lib/auth/types";
import type { ApiGroup } from "@/lib/types";

/** "Popular groups" with real membership — join and leave save to the backend. */
export function GroupsCard() {
  const { firebaseUser, profile } = useAuth();
  const router = useRouter();
  const [groups, setGroups] = useState<ApiGroup[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const viewerId = profile ? String(profile.id) : null;

  // Re-read when the viewer changes: `joinedByCurrentUser` depends on who asks.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const list = await api.get<ApiGroup[]>(COMMUNITY_ENDPOINTS.groups);
        if (!cancelled) setGroups(list ?? []);
      } catch {
        if (!cancelled) setGroups([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [viewerId]);

  async function toggle(group: ApiGroup) {
    if (!firebaseUser) {
      router.push("/login");
      return;
    }
    const joining = !group.joinedByCurrentUser;
    setBusy(group.id);
    try {
      if (joining) await api.post(COMMUNITY_ENDPOINTS.join(group.id));
      else await api.del(COMMUNITY_ENDPOINTS.leave(group.id));
      setGroups((prev) =>
        (prev ?? []).map((g) =>
          g.id === group.id
            ? {
                ...g,
                joinedByCurrentUser: joining,
                memberCount: Math.max(0, (g.memberCount ?? 0) + (joining ? 1 : -1)),
              }
            : g,
        ),
      );
    } catch {
      /* leave the button as it was; the member can try again */
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-xl border border-line bg-card p-[18px]">
      <div className="mb-3 flex items-baseline justify-between">
        <h4 className="font-serif text-base font-semibold">Popular groups</h4>
        {/* Hub team only — members and business owners never see this. */}
        {canModerate(profile) && (
          <Link href="/staff#groups" className="text-xs font-semibold text-accent">
            Manage groups →
          </Link>
        )}
      </div>
      {groups === null ? (
        <p className="text-[13px] text-muted">Loading…</p>
      ) : groups.length === 0 ? (
        <p className="text-[13px] text-muted">No groups yet.</p>
      ) : (
        groups.map((group) => {
          const joined = !!group.joinedByCurrentUser;
          const members = group.memberCount ?? 0;
          return (
            <div
              key={group.id}
              className="flex items-center gap-[11px] border-t border-line py-2 first:border-t-0"
            >
              <div className="grid size-[34px] place-items-center rounded-[9px] bg-accent-soft text-[15px]">
                {group.icon || "👥"}
              </div>
              <Link
                href={`/community/groups/${encodeURIComponent(group.id)}`}
                className="min-w-0 hover:underline"
              >
                <div className="truncate text-sm font-semibold">{group.name}</div>
                <div className="text-xs text-muted">
                  {members} member{members === 1 ? "" : "s"}
                </div>
              </Link>
              <button
                type="button"
                disabled={busy === group.id}
                onClick={() => void toggle(group)}
                className={`ml-auto cursor-pointer rounded-full border border-accent px-3 py-[5px] text-xs font-semibold transition disabled:opacity-60 ${
                  joined ? "bg-accent text-white" : "text-accent"
                }`}
              >
                {joined ? "Joined" : "Join"}
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}
