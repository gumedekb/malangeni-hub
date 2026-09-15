"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api, ApiError, COMMUNITY_ENDPOINTS } from "@/lib/api";
import { useAuth } from "@/lib/auth/AuthContext";
import { canModerate } from "@/lib/auth/types";
import { usePostFeed } from "@/lib/usePostFeed";
import { loginHref, nameOf, profileHref } from "@/lib/users";
import type { ApiGroup, GroupMembership } from "@/lib/types";
import { GroupForm } from "@/components/staff/GroupForm";
import { Avatar } from "@/components/ui/Avatar";
import { UserBadges } from "@/components/ui/UserBadges";
import { FeedNote } from "@/components/posts/FeedNote";
import { LoadMore } from "@/components/posts/LoadMore";
import { PostCard } from "@/components/posts/PostCard";

/**
 * A group's page: what it is, who's in it, and what's been posted to it.
 */
export function GroupDetail({ id }: { id: string }) {
  const { firebaseUser, profile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const viewerId = profile ? String(profile.id) : null;

  const [group, setGroup] = useState<ApiGroup | null>(null);
  const [members, setMembers] = useState<GroupMembership[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);

  const feed = usePostFeed({ groupId: id });

  // Admins and moderators manage groups; everyone else only joins and reads.
  const staff = canModerate(profile);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const g = await api.get<ApiGroup>(COMMUNITY_ENDPOINTS.group(id));
        if (cancelled) return;
        setGroup(g);
        const m = await api.get<GroupMembership[]>(COMMUNITY_ENDPOINTS.members(id)).catch(() => []);
        if (!cancelled) setMembers(m ?? []);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof ApiError && err.status === 404
            ? "We couldn't find that group."
            : err instanceof Error
              ? err.message
              : "Could not load this group.",
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, viewerId]);

  async function toggle() {
    if (!group) return;
    if (!firebaseUser) {
      router.push(loginHref(pathname));
      return;
    }
    const joining = !group.joinedByCurrentUser;
    setBusy(true);
    try {
      if (joining) await api.post(COMMUNITY_ENDPOINTS.join(id));
      else await api.del(COMMUNITY_ENDPOINTS.leave(id));
      setGroup({
        ...group,
        joinedByCurrentUser: joining,
        memberCount: Math.max(0, (group.memberCount ?? 0) + (joining ? 1 : -1)),
      });
      const m = await api.get<GroupMembership[]>(COMMUNITY_ENDPOINTS.members(id));
      setMembers(m ?? []);
    } catch {
      /* unchanged; they can try again */
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!group) return;
    if (!window.confirm(`Delete the group “${group.name}”? Members will be removed from it.`)) return;
    setStaffError(null);
    setBusy(true);
    try {
      await api.del(COMMUNITY_ENDPOINTS.group(id));
      router.push("/community");
    } catch (err) {
      setStaffError(
        err instanceof ApiError && err.status === 409
          ? "This group still has posts, so it can't be deleted."
          : err instanceof Error
            ? err.message
            : "Could not delete the group.",
      );
      setBusy(false);
    }
  }

  if (error) return <Note>{error}</Note>;
  if (!group) return <Note>Loading…</Note>;

  return (
    <Shell>
      <Header
        icon={group.icon}
        name={group.name}
        memberCount={group.memberCount ?? 0}
        description={group.description}
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/community/new?group=${encodeURIComponent(id)}`}
              className="rounded-full bg-accent px-4 py-2 text-[13px] font-semibold text-white transition hover:opacity-95"
            >
              Create post
            </Link>
            <button
              type="button"
              disabled={busy}
              onClick={() => void toggle()}
              className={`cursor-pointer rounded-full border border-accent px-4 py-2 text-[13px] font-semibold transition disabled:opacity-60 ${
                group.joinedByCurrentUser ? "bg-accent text-white" : "text-accent"
              }`}
            >
              {group.joinedByCurrentUser ? "Joined — leave" : "Join group"}
            </button>
            {/* Hub team only — members and business owners never see these. */}
            {staff && (
              <>
                <button
                  type="button"
                  onClick={() => setEditing((v) => !v)}
                  className="cursor-pointer rounded-full border border-line px-4 py-2 text-[13px] font-semibold text-ink transition hover:border-ink"
                >
                  {editing ? "Close editor" : "Edit group"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void remove()}
                  className="cursor-pointer rounded-full border border-line px-4 py-2 text-[13px] font-semibold text-accent transition hover:border-accent disabled:opacity-60"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        }
      />

      {staff && staffError && (
        <p role="alert" className="mt-4 rounded-lg border border-accent bg-accent-soft px-3.5 py-2.5 text-[13px] text-accent">
          {staffError}
        </p>
      )}
      {staff && editing && (
        <section className="mt-4 rounded-card border border-line bg-card p-6">
          <h3 className="mb-4 font-serif text-[18px] font-semibold">Edit group</h3>
          <GroupForm
            group={group}
            onSaved={(saved) => {
              setGroup(saved);
              setEditing(false);
            }}
            onCancel={() => setEditing(false)}
          />
        </section>
      )}

      <div className="mt-6 grid grid-cols-1 items-start gap-6 md:grid-cols-[1fr_280px]">
        <section>
          <h3 className="font-serif text-[20px] font-semibold">Posts</h3>
          <div className="mt-3 flex flex-col gap-4">
            {feed.loading ? (
              <FeedNote>Loading…</FeedNote>
            ) : feed.error && feed.posts.length === 0 ? (
              <FeedNote tone="error" onRetry={feed.reload}>
                {feed.error}
              </FeedNote>
            ) : feed.posts.length === 0 ? (
              <FeedNote tone="empty">
                Nothing has been posted to this group yet —{" "}
                <Link href={`/community/new?group=${encodeURIComponent(id)}`} className="font-semibold text-accent">
                  be the first
                </Link>
                .
              </FeedNote>
            ) : (
              feed.posts.map((post) => (
                <PostCard key={post.id} post={post} onChange={feed.update} onDelete={feed.remove} />
              ))
            )}
            <LoadMore hasMore={feed.hasMore} loading={feed.loadingMore} onLoadMore={feed.loadMore} />
          </div>
        </section>

        <aside className="rounded-xl border border-line bg-card p-[18px]">
          <h4 className="mb-3 font-serif text-base font-semibold">Members</h4>
          {members === null ? (
            <p className="text-[13px] text-muted">Loading…</p>
          ) : members.length === 0 ? (
            <p className="text-[13px] text-muted">No members yet — be the first.</p>
          ) : (
            <ul className="flex flex-col">
              {members.map((m) => (
                <li key={m.id} className="flex items-center gap-2.5 border-t border-line py-2 first:border-t-0">
                  <Avatar src={m.user?.avatarUrl} name={nameOf(m.user)} size={28} />
                  {m.user ? (
                    <Link href={profileHref(m.user.username)} className="truncate text-sm font-semibold hover:underline">
                      {nameOf(m.user)}
                    </Link>
                  ) : (
                    <span className="text-sm text-muted">Member</span>
                  )}
                  <UserBadges role={m.user?.role} badge={m.user?.badge} className="ml-auto" />
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </Shell>
  );
}

function Header({
  icon,
  name,
  memberCount,
  description,
  action,
}: {
  icon?: string | null;
  name: string;
  memberCount: number;
  description?: string | null;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-card border border-line bg-card p-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="grid size-14 place-items-center rounded-[12px] bg-accent-soft text-[26px]">
          {icon || "👥"}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-serif text-[24px] font-semibold">{name}</h2>
          <p className="text-[13px] text-muted">
            {memberCount} member{memberCount === 1 ? "" : "s"}
          </p>
        </div>
        {action}
      </div>
      {description && <p className="mt-4 text-[14px] leading-relaxed text-muted">{description}</p>}
    </section>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-16">
      <Link href="/community" className="text-[13px] font-semibold text-accent">
        ← Community
      </Link>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="py-14 text-[14px] text-muted">{children}</p>;
}
