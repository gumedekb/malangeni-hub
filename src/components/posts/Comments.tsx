"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api, POST_ENDPOINTS } from "@/lib/api";
import { useAuth } from "@/lib/auth/AuthContext";
import { canModerate, isOwner } from "@/lib/auth/types";
import { asPublicUser, loginHref, nameOf } from "@/lib/users";
import type { ApiComment } from "@/lib/types";
import { Byline } from "./Byline";
import { FeedNote } from "./FeedNote";

/** Same limit as the backend. */
const MAX_COMMENT = 2000;

/**
 * A post's conversation: comments oldest first, each with its replies (one
 * level deep, like the backend). Members comment and reply; a comment's author
 * and the hub team can delete it, which takes its replies with it.
 */
export function Comments({
  postId,
  onCountChange,
}: {
  postId: string;
  /** Keeps the post's comment count in step: +1 per comment, minus what a delete removed. */
  onCountChange: (delta: number) => void;
}) {
  const { firebaseUser, profile, loading } = useAuth();
  const pathname = usePathname();
  const [comments, setComments] = useState<ApiComment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const [replyTo, setReplyTo] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const list = await api.get<ApiComment[]>(POST_ENDPOINTS.comments(postId));
        if (!cancelled) {
          setComments(list ?? []);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load the comments.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [postId, nonce]);

  function added(comment: ApiComment) {
    setComments((prev) => [...(prev ?? []), comment]);
    setReplyTo(null);
    onCountChange(1);
  }

  async function remove(comment: ApiComment) {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await api.del(POST_ENDPOINTS.comment(postId, comment.id));
      const gone = (comments ?? []).filter(
        (c) => c.id === comment.id || c.parentCommentId === comment.id,
      ).length;
      setComments((prev) =>
        (prev ?? []).filter((c) => c.id !== comment.id && c.parentCommentId !== comment.id),
      );
      onCountChange(-gone);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the comment.");
    }
  }

  const topLevel = (comments ?? []).filter((c) => !c.parentCommentId);
  const repliesTo = (id: string) => (comments ?? []).filter((c) => c.parentCommentId === id);
  const canDelete = (c: ApiComment) => isOwner(profile, c.authorId) || canModerate(profile);

  return (
    <section id="comments" className="mt-8 scroll-mt-24">
      <h2 className="font-serif text-[20px] font-semibold">
        Comments{comments ? ` (${comments.length})` : ""}
      </h2>

      {profile ? (
        <CommentForm postId={postId} onAdded={added} />
      ) : !loading && !firebaseUser ? (
        <p className="mt-3 rounded-xl border border-line bg-card p-4 text-[14px] text-muted">
          <Link href={loginHref(pathname)} className="font-semibold text-accent">
            Sign in
          </Link>{" "}
          to join the conversation.
        </p>
      ) : null}

      {error && (
        <FeedNote
          tone="error"
          className="mt-4"
          onRetry={() => {
            setError(null);
            setNonce((n) => n + 1);
          }}
        >
          {error}
        </FeedNote>
      )}

      {comments === null ? (
        !error && <FeedNote>Loading comments…</FeedNote>
      ) : topLevel.length === 0 ? (
        <FeedNote tone="empty" className="mt-4">
          No comments yet{profile ? " — be the first." : "."}
        </FeedNote>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {topLevel.map((c) => {
            const replies = repliesTo(c.id);
            const replying = replyTo === c.id;
            return (
              <li key={c.id} className="rounded-xl border border-line bg-card p-4">
                <CommentBody
                  comment={c}
                  canDelete={canDelete(c)}
                  onDelete={() => void remove(c)}
                  onReply={profile ? () => setReplyTo(replying ? null : c.id) : undefined}
                  replying={replying}
                />
                {(replies.length > 0 || replying) && (
                  <ul className="mt-3 flex flex-col gap-3 border-l-2 border-line pl-4">
                    {replies.map((r) => (
                      <li key={r.id}>
                        <CommentBody comment={r} canDelete={canDelete(r)} onDelete={() => void remove(r)} />
                      </li>
                    ))}
                    {replying && profile && (
                      <li>
                        <CommentForm
                          postId={postId}
                          parentId={c.id}
                          placeholder={`Reply to ${nameOf(c.author)}…`}
                          onAdded={added}
                          onCancel={() => setReplyTo(null)}
                        />
                      </li>
                    )}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function CommentBody({
  comment,
  canDelete,
  onDelete,
  onReply,
  replying = false,
}: {
  comment: ApiComment;
  canDelete: boolean;
  onDelete: () => void;
  /** Only top-level comments take replies, and only from signed-in members. */
  onReply?: () => void;
  replying?: boolean;
}) {
  return (
    <div>
      <Byline user={comment.author} createdAt={comment.createdAt} size={30} />
      <p className="mt-2 whitespace-pre-line text-[14px] leading-relaxed">{comment.body}</p>
      {(onReply || canDelete) && (
        <div className="mt-2 flex gap-4 text-[12.5px] font-semibold text-muted">
          {onReply && (
            <button type="button" onClick={onReply} className="cursor-pointer transition hover:text-ink">
              {replying ? "Cancel reply" : "Reply"}
            </button>
          )}
          {canDelete && (
            <button type="button" onClick={onDelete} className="cursor-pointer text-accent">
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function CommentForm({
  postId,
  parentId,
  placeholder = "Write a comment…",
  onAdded,
  onCancel,
}: {
  postId: string;
  parentId?: string;
  placeholder?: string;
  onAdded: (comment: ApiComment) => void;
  onCancel?: () => void;
}) {
  const { profile } = useAuth();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || !body.trim()) return;
    setError(null);
    setSending(true);
    try {
      const saved = await api.post<ApiComment>(POST_ENDPOINTS.comments(postId), {
        body: body.trim(),
        parentCommentId: parentId,
      });
      onAdded({ ...saved, author: saved.author ?? asPublicUser(profile) });
      setBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send your comment.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={(e) => void send(e)} className={parentId ? "" : "mt-3"}>
      {error && (
        <p role="alert" className="mb-2 text-[13px] text-accent">
          {error}
        </p>
      )}
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={parentId ? 2 : 3}
        maxLength={MAX_COMMENT}
        placeholder={placeholder}
        aria-label={parentId ? "Your reply" : "Your comment"}
        className="w-full rounded-[10px] border border-line bg-paper px-4 py-3 text-sm outline-none focus:border-accent"
      />
      <div className="mt-2 flex items-center gap-3">
        <button
          type="submit"
          disabled={sending || !body.trim()}
          className="cursor-pointer rounded-lg bg-accent px-4 py-2 text-[13px] font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sending ? "Sending…" : parentId ? "Reply" : "Comment"}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="cursor-pointer text-[13px] font-semibold text-muted hover:text-ink">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
