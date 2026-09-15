"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError, publicProfilePath } from "@/lib/api";
import { useAuth } from "@/lib/auth/AuthContext";
import type { PublicProfile as PublicProfileData } from "@/lib/auth/types";
import { usePostFeed } from "@/lib/usePostFeed";
import { nameOf } from "@/lib/users";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { Avatar } from "@/components/ui/Avatar";
import { UserBadges } from "@/components/ui/UserBadges";
import { FeedNote } from "@/components/posts/FeedNote";
import { LoadMore } from "@/components/posts/LoadMore";
import { PostCard } from "@/components/posts/PostCard";

/**
 * Another member's profile: who they are and what they've posted. Members only.
 *
 * Shows deliberately little — name, picture, badges, when they joined. **No
 * email**, and no role unless it's one the community benefits from seeing
 * (handled inside `UserBadges`). The backend returns a projection without the
 * email, because anything in the response is visible in devtools.
 */
export function PublicProfile({ username }: { username: string }) {
  return (
    <RequireAuth>
      <Profile username={username} />
    </RequireAuth>
  );
}

function Profile({ username }: { username: string }) {
  const { profile: viewer } = useAuth();
  const [person, setPerson] = useState<PublicProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const found = await api.get<PublicProfileData>(publicProfilePath(username));
        if (!cancelled) setPerson(found);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof ApiError && err.status === 404
            ? `No member called “${username}”.`
            : err instanceof Error
              ? err.message
              : "Could not load this profile.",
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [username]);

  const feed = usePostFeed({ authorId: person?.id }, { enabled: !!person });

  if (error) return <Note>{error}</Note>;
  if (!person) return <Note>Loading…</Note>;

  const isSelf = !!viewer && String(viewer.id) === String(person.id);
  const name = nameOf(person);

  return (
    <div className="w-full max-w-[680px] pb-16">
      <section className="rounded-card border border-line bg-card p-6">
        <div className="flex items-center gap-4">
          <Avatar src={person.avatarUrl} name={name} size={72} />
          <div className="min-w-0">
            <h2 className="truncate font-serif text-[24px] font-semibold">{name}</h2>
            <p className="text-[13px] text-muted">@{person.username}</p>
            <UserBadges role={person.role} badge={person.badge} className="mt-1.5" />
            {person.createdAt && (
              <p className="mt-1.5 text-[12.5px] text-muted">
                Member since{" "}
                {new Date(person.createdAt).toLocaleDateString("en-ZA", { year: "numeric", month: "long" })}
              </p>
            )}
          </div>
        </div>
        {isSelf && (
          <Link
            href="/profile"
            className="mt-4 inline-block rounded-lg border border-line px-4 py-2.5 text-[13px] font-semibold text-ink transition hover:border-ink"
          >
            Edit your profile
          </Link>
        )}
      </section>

      <h3 className="mt-8 font-serif text-[20px] font-semibold">
        Posts{feed.total ? ` (${feed.total})` : ""}
      </h3>

      <div className="mt-3 flex flex-col gap-4">
        {feed.loading ? (
          <FeedNote>Loading…</FeedNote>
        ) : feed.error && feed.posts.length === 0 ? (
          <FeedNote tone="error" onRetry={feed.reload}>
            {feed.error}
          </FeedNote>
        ) : feed.posts.length === 0 ? (
          <FeedNote tone="empty">
            {isSelf ? "You haven't posted anything yet." : `${name} hasn't posted anything yet.`}
          </FeedNote>
        ) : (
          feed.posts.map((post) => (
            <PostCard key={post.id} post={post} onChange={feed.update} onDelete={feed.remove} />
          ))
        )}
        <LoadMore hasMore={feed.hasMore} loading={feed.loadingMore} onLoadMore={feed.loadMore} />
      </div>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="py-14 text-[14px] text-muted">{children}</p>;
}
