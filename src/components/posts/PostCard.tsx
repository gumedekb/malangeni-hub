"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { api, POST_ENDPOINTS } from "@/lib/api";
import { useAuth } from "@/lib/auth/AuthContext";
import { canModerate, isOwner } from "@/lib/auth/types";
import { fitImage } from "@/lib/cloudinary";
import { postPath, postTypeLabel } from "@/lib/posts";
import type { ApiPost, PostType } from "@/lib/types";
import { Byline } from "./Byline";
import { LikeButton } from "./LikeButton";
import { ShareButton } from "./ShareButton";

/**
 * A post in a list (Community, a group, a profile). The title opens the post
 * with its comments; likes save straight away; the author and the hub team can
 * delete it here and edit it on the post's page.
 */
export function PostCard({
  post,
  groupName,
  onChange,
  onDelete,
}: {
  post: ApiPost;
  /** Shown as a link to the group; leave out on the group's own page. */
  groupName?: string | null;
  onChange: (post: ApiPost) => void;
  onDelete: (id: string) => void;
}) {
  const { profile } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const href = postPath(post.id);
  const canManage = isOwner(profile, post.authorId) || canModerate(profile);

  async function remove() {
    if (!window.confirm(`Delete “${post.title}”?`)) return;
    setError(null);
    setDeleting(true);
    try {
      await api.del(POST_ENDPOINTS.post(post.id));
      onDelete(post.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the post.");
      setDeleting(false);
    }
  }

  return (
    <article className="rounded-xl border border-line bg-card p-[18px] transition hover:shadow-[0_4px_16px_rgba(0,0,0,0.05)]">
      <div className="mb-2.5 flex flex-wrap items-start gap-2.5">
        <Byline user={post.author} createdAt={post.createdAt} />
        <div className="ml-auto flex flex-wrap gap-1.5">
          <TypeTag type={post.type} />
          {groupName && post.groupId && (
            <Link
              href={`/community/groups/${encodeURIComponent(post.groupId)}`}
              className="rounded-full bg-accent-soft px-2.5 py-[3px] text-[11px] font-semibold uppercase tracking-[0.5px] text-accent"
            >
              {groupName}
            </Link>
          )}
        </div>
      </div>

      <h3 className="mb-1.5 font-serif text-lg font-semibold">
        <Link href={href} className="hover:underline">
          {post.title}
        </Link>
      </h3>
      {post.body && <p className="line-clamp-4 whitespace-pre-line text-sm text-muted">{post.body}</p>}
      {/* The whole picture, never cropped: capped in height and centred on a soft backdrop. */}
      {post.imageUrl && (
        <Link
          href={href}
          tabIndex={-1}
          aria-hidden="true"
          className="mt-3 flex justify-center overflow-hidden rounded-lg border border-line bg-paper"
        >
          <Image
            src={fitImage(post.imageUrl, 1200)}
            alt=""
            width={1200}
            height={800}
            unoptimized
            className="h-auto max-h-[360px] w-auto max-w-full"
          />
        </Link>
      )}

      {error && (
        <p role="alert" className="mt-3 text-[13px] text-accent">
          {error}
        </p>
      )}

      <PostActions post={post} onChange={onChange} commentsHref={`${href}#comments`}>
        {canManage && (
          <button
            type="button"
            disabled={deleting}
            onClick={() => void remove()}
            className="ml-auto cursor-pointer text-accent disabled:cursor-wait disabled:opacity-60"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        )}
      </PostActions>
    </article>
  );
}

/** The type pill: Discussion, News, Notice or Job. */
export function TypeTag({ type }: { type: PostType }) {
  return (
    <span className="rounded-full bg-tag px-2.5 py-[3px] text-[11px] font-semibold uppercase tracking-[0.5px] text-gold">
      {postTypeLabel(type)}
    </span>
  );
}

/** Like, comments and share — the same row on cards and on the post's page. */
export function PostActions({
  post,
  onChange,
  commentsHref,
  children,
}: {
  post: ApiPost;
  onChange: (post: ApiPost) => void;
  commentsHref: string;
  /** Extra actions (edit, delete) at the end of the row. */
  children?: React.ReactNode;
}) {
  const comments = `${post.commentCount} comment${post.commentCount === 1 ? "" : "s"}`;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-[18px] gap-y-2 text-[12.5px] text-muted">
      <LikeButton post={post} onChange={onChange} />
      <Link href={commentsHref} className="transition hover:text-ink">
        <span aria-hidden="true">💬</span> {comments}
      </Link>
      <ShareButton path={postPath(post.id)} title={post.title} />
      {children}
    </div>
  );
}
