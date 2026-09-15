"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { fitImage } from "@/lib/cloudinary";
import { postPath } from "@/lib/posts";
import { usePostFeed } from "@/lib/usePostFeed";
import type { ApiPost, PostType } from "@/lib/types";
import { Byline } from "@/components/posts/Byline";
import { FeedNote } from "@/components/posts/FeedNote";
import { LoadMore } from "@/components/posts/LoadMore";
import { PostActions, TypeTag } from "@/components/posts/PostCard";
import { SponsorCard } from "@/components/ui/SponsorCard";

type Filter = "all" | "discussion" | "news" | "notice" | "job";

/** Every kind of post; no types means all of them. */
const FILTERS: { id: Filter; label: string; empty: string; types: PostType[] }[] = [
  { id: "all", label: "All", empty: "Nothing has been posted yet.", types: [] },
  { id: "discussion", label: "Discussions", empty: "No discussions yet.", types: ["COMMUNITY"] },
  { id: "news", label: "News", empty: "No news yet.", types: ["NEWS"] },
  { id: "notice", label: "Notices", empty: "No notices yet.", types: ["NOTICE"] },
  { id: "job", label: "Jobs", empty: "No jobs posted yet.", types: ["JOB"] },
];

/**
 * The home page's masonry feed. Cards take the shape of their post: a picture
 * is always shown whole (never cropped), capped in height, and text-only posts
 * are just as tall as their words.
 */
export function CommunityFeed() {
  const [filter, setFilter] = useState<Filter>("all");
  const active = FILTERS.find((f) => f.id === filter) ?? FILTERS[0];
  const feed = usePostFeed({ types: active.types }, { size: 9 });

  return (
    <>
      <div className="mb-4 mt-[34px] flex flex-wrap items-baseline justify-between gap-3">
        <h3 className="font-serif text-2xl font-semibold">Community feed</h3>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-[13px] transition ${
                filter === f.id ? "border-ink bg-ink text-on-ink" : "border-line bg-card text-muted hover:text-ink"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {feed.loading ? (
        <FeedNote>Loading…</FeedNote>
      ) : feed.error && feed.posts.length === 0 ? (
        <FeedNote tone="error" onRetry={feed.reload}>
          {feed.error}
        </FeedNote>
      ) : feed.posts.length === 0 ? (
        <FeedNote tone="empty">
          {active.empty}{" "}
          <Link href="/community/new" className="font-semibold text-accent">
            Share something
          </Link>
        </FeedNote>
      ) : (
        <section className="gap-5 [column-gap:20px] sm:columns-2 md:columns-3">
          {feed.posts.map((post) => (
            <FeedCard key={post.id} post={post} onChange={feed.update} />
          ))}
          {filter === "all" && <SponsorCard placement="FEED" className="mb-5 break-inside-avoid" />}
        </section>
      )}
      <LoadMore hasMore={feed.hasMore} loading={feed.loadingMore} onLoadMore={feed.loadMore} />
    </>
  );
}

function FeedCard({ post, onChange }: { post: ApiPost; onChange: (post: ApiPost) => void }) {
  const href = postPath(post.id);
  return (
    <article
      className={`mb-5 break-inside-avoid rounded-xl border border-line transition hover:shadow-[0_6px_22px_rgba(0,0,0,0.07)] ${
        post.imageUrl ? "bg-card" : "bg-[linear-gradient(150deg,var(--color-card),var(--color-paper-warm))]"
      }`}
    >
      {post.imageUrl && (
        <Link
          href={href}
          tabIndex={-1}
          aria-hidden="true"
          className="flex justify-center overflow-hidden rounded-t-xl border-b border-line bg-paper"
        >
          <Image
            src={fitImage(post.imageUrl, 900)}
            alt=""
            width={900}
            height={600}
            unoptimized
            className="h-auto max-h-[420px] w-auto max-w-full"
          />
        </Link>
      )}
      <div className="p-4">
        <div className="mb-2.5 flex items-start gap-2">
          <Byline user={post.author} createdAt={post.createdAt} size={28} />
          <span className="ml-auto shrink-0">
            <TypeTag type={post.type} />
          </span>
        </div>
        <h4 className={`mb-1.5 font-serif font-semibold ${post.imageUrl ? "text-lg" : "text-xl"}`}>
          <Link href={href} className="hover:underline">
            {post.title}
          </Link>
        </h4>
        {post.body && <p className="line-clamp-4 whitespace-pre-line text-[13.5px] text-muted">{post.body}</p>}
        <PostActions post={post} onChange={onChange} commentsHref={`${href}#comments`} />
      </div>
    </article>
  );
}
