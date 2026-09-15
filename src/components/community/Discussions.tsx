"use client";

import { useGroups } from "@/lib/useGroups";
import { usePostFeed } from "@/lib/usePostFeed";
import { FeedNote } from "@/components/posts/FeedNote";
import { LoadMore } from "@/components/posts/LoadMore";
import { PostCard } from "@/components/posts/PostCard";
import { PostComposer } from "@/components/posts/PostComposer";

/**
 * The Community page's composer and every post, newest first, loading more as
 * you scroll. Each post opens on its own page with the comments.
 */
export function Discussions() {
  const groups = useGroups();
  const feed = usePostFeed({});

  const groupName = (id?: string | null) => (id ? groups?.find((g) => g.id === id)?.name ?? null : null);

  return (
    <div>
      <PostComposer groups={groups} onPosted={feed.prepend} />

      <div className="mt-[18px] flex flex-col gap-4">
        {feed.loading ? (
          <FeedNote>Loading…</FeedNote>
        ) : feed.error && feed.posts.length === 0 ? (
          <FeedNote tone="error" onRetry={feed.reload}>
            {feed.error}
          </FeedNote>
        ) : feed.posts.length === 0 ? (
          <FeedNote tone="empty">Nothing has been posted yet — start the conversation.</FeedNote>
        ) : (
          feed.posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              groupName={groupName(post.groupId)}
              onChange={feed.update}
              onDelete={feed.remove}
            />
          ))
        )}
        <LoadMore hasMore={feed.hasMore} loading={feed.loadingMore} onLoadMore={feed.loadMore} />
      </div>
    </div>
  );
}
