"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError, POST_ENDPOINTS } from "@/lib/api";
import { useAuth } from "@/lib/auth/AuthContext";
import { canModerate, isOwner } from "@/lib/auth/types";
import { fitImage } from "@/lib/cloudinary";
import { IMAGE_ACCEPT, imageProblem, prepareImage } from "@/lib/images";
import { POST_TAGS } from "@/lib/posts";
import { useGroups } from "@/lib/useGroups";
import type { ApiPost, PostType } from "@/lib/types";
import { FilePreview } from "@/components/ui/FilePreview";
import { Byline } from "./Byline";
import { Comments } from "./Comments";
import { PostActions, TypeTag } from "./PostCard";

/**
 * One post in full, with its comments. The author and the hub team can edit it
 * (text, tag and picture) or delete it here.
 */
export function PostDetail({ id }: { id: string }) {
  const { profile } = useAuth();
  const router = useRouter();
  const groups = useGroups();
  const viewerId = profile ? String(profile.id) : null;

  const [post, setPost] = useState<ApiPost | null>(null);
  const [error, setError] = useState<{ missing: boolean; message: string } | null>(null);
  const [nonce, setNonce] = useState(0);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Re-read when the viewer changes: `likedByCurrentUser` depends on who asks.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const found = await api.get<ApiPost>(POST_ENDPOINTS.post(id));
        if (!cancelled) {
          setPost(found);
          setError(null);
        }
      } catch (err) {
        if (cancelled) return;
        setError({
          missing: err instanceof ApiError && err.status === 404,
          message: err instanceof Error ? err.message : "Could not load this post.",
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, viewerId, nonce]);

  if (error && !post) {
    if (error.missing) return <Missing />;
    return (
      <p className="py-14 text-center text-[14px] text-muted">
        {error.message}{" "}
        <button type="button" onClick={() => setNonce((n) => n + 1)} className="cursor-pointer font-semibold text-accent">
          Try again
        </button>
      </p>
    );
  }
  if (!post) return <p className="py-14 text-center text-[14px] text-muted">Loading…</p>;

  const canManage = isOwner(profile, post.authorId) || canModerate(profile);
  const groupName = post.groupId ? groups?.find((g) => g.id === post.groupId)?.name : null;

  async function remove() {
    if (!post || !window.confirm(`Delete “${post.title}”? Its comments go with it.`)) return;
    setActionError(null);
    setDeleting(true);
    try {
      await api.del(POST_ENDPOINTS.post(post.id));
      router.push("/community");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not delete the post.");
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[720px] pb-16">
      <Link href="/community" className="text-[13px] font-semibold text-accent">
        ← Community
      </Link>

      <article className="mt-4 rounded-card border border-line bg-card p-6">
        <div className="flex flex-wrap items-start gap-2.5">
          <Byline user={post.author} createdAt={post.createdAt} size={40} />
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

        {editing ? (
          <PostEditForm
            post={post}
            onSaved={(saved, warning) => {
              // Keep the author on screen if the response came back without it.
              setPost((prev) => ({ ...saved, author: saved.author ?? prev?.author }));
              setEditing(false);
              setActionError(warning ?? null);
            }}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <>
            <h1 className="mt-5 font-serif text-[26px] font-semibold leading-tight">{post.title}</h1>
            {post.body && <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed">{post.body}</p>}
            {/* The whole picture, never cropped. */}
            {post.imageUrl && (
              <div className="mt-4 flex justify-center overflow-hidden rounded-lg border border-line bg-paper">
                <Image
                  src={fitImage(post.imageUrl, 1600)}
                  alt=""
                  width={1600}
                  height={1067}
                  unoptimized
                  className="h-auto max-h-[75vh] w-auto max-w-full"
                />
              </div>
            )}
          </>
        )}

        {actionError && (
          <p role="alert" className="mt-4 text-[13px] text-accent">
            {actionError}
          </p>
        )}

        <PostActions post={post} onChange={setPost} commentsHref="#comments">
          {canManage && !editing && (
            <span className="ml-auto flex gap-4">
              <button type="button" onClick={() => setEditing(true)} className="cursor-pointer font-semibold hover:text-ink">
                Edit
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => void remove()}
                className="cursor-pointer font-semibold text-accent disabled:cursor-wait disabled:opacity-60"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </span>
          )}
        </PostActions>
      </article>

      <Comments
        postId={post.id}
        onCountChange={(delta) =>
          setPost((prev) => (prev ? { ...prev, commentCount: Math.max(0, prev.commentCount + delta) } : prev))
        }
      />
    </div>
  );
}

function PostEditForm({
  post,
  onSaved,
  onCancel,
}: {
  post: ApiPost;
  /** `warning` is set when the text saved but the picture change didn't. */
  onSaved: (post: ApiPost, warning?: string) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(post.title);
  const [body, setBody] = useState(post.body ?? "");
  const [type, setType] = useState<PostType>(post.type);
  const [newImage, setNewImage] = useState<File | null>(null);
  const [removePicture, setRemovePicture] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function pickImage(file: File | null) {
    if (!file) return;
    const problem = imageProblem(file);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setNewImage(file);
    setRemovePicture(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Give your post a title.");
      return;
    }
    setError(null);
    setSaving(true);
    let saved: ApiPost;
    try {
      saved = await api.put<ApiPost>(POST_ENDPOINTS.post(post.id), { title: title.trim(), body: body.trim(), type });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your changes.");
      setSaving(false);
      return;
    }

    let warning: string | undefined;
    try {
      if (newImage) {
        const form = new FormData();
        form.append("file", await prepareImage(newImage));
        saved = await api.postForm<ApiPost>(POST_ENDPOINTS.image(post.id), form);
      } else if (removePicture && post.imageUrl) {
        saved = await api.del<ApiPost>(POST_ENDPOINTS.image(post.id));
      }
    } catch (err) {
      warning = `Your changes were saved, but the picture didn't update${err instanceof Error ? `: ${err.message}` : "."}`;
    }
    onSaved(saved, warning);
  }

  const inputClass = "w-full rounded-[10px] border border-line bg-paper px-4 py-3 text-sm outline-none focus:border-accent";
  const fileInput = (label: string) => (
    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line px-3.5 py-2 text-[13px] font-semibold text-ink transition hover:border-ink">
      <span aria-hidden="true">📷</span> {label}
      <input
        type="file"
        accept={IMAGE_ACCEPT}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null;
          e.target.value = "";
          pickImage(file);
        }}
      />
    </label>
  );

  return (
    <form onSubmit={(e) => void save(e)} className="mt-5 flex flex-col gap-3">
      {error && (
        <p role="alert" className="rounded-lg border border-accent bg-accent-soft px-3.5 py-2.5 text-[13px] text-accent">
          {error}
        </p>
      )}
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={255}
        required
        aria-label="Title"
        className={`${inputClass} font-serif text-lg font-semibold`}
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={6}
        aria-label="Details"
        placeholder="Details (optional)"
        className={inputClass}
      />

      <div>
        <div className="mb-1.5 text-[12px] font-semibold uppercase tracking-[0.5px] text-muted">Picture</div>
        {newImage ? (
          <div className="flex flex-col items-start gap-2">
            <FilePreview file={newImage} alt="New picture" className="h-auto max-h-48 w-auto rounded-lg border border-line" />
            <div className="flex flex-wrap gap-3">
              {fileInput("Choose another")}
              <button type="button" onClick={() => setNewImage(null)} className="cursor-pointer text-[13px] font-semibold text-muted hover:text-ink">
                Keep the old picture
              </button>
            </div>
          </div>
        ) : post.imageUrl && !removePicture ? (
          <div className="flex flex-col items-start gap-2">
            <Image
              src={fitImage(post.imageUrl, 600)}
              alt="Current picture"
              width={600}
              height={400}
              unoptimized
              className="h-auto max-h-48 w-auto rounded-lg border border-line"
            />
            <div className="flex flex-wrap gap-3">
              {fileInput("Replace picture")}
              <button type="button" onClick={() => setRemovePicture(true)} className="cursor-pointer text-[13px] font-semibold text-accent">
                Remove picture
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            {fileInput("Add a picture")}
            {removePicture && (
              <span className="text-[13px] text-muted">
                The picture will be removed.{" "}
                <button type="button" onClick={() => setRemovePicture(false)} className="cursor-pointer font-semibold text-ink underline">
                  Undo
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Post tag">
        {POST_TAGS.map((t) => (
          <button
            key={t.type}
            type="button"
            role="radio"
            aria-checked={type === t.type}
            onClick={() => setType(t.type)}
            className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-[13px] transition ${
              type === t.type ? "border-ink bg-ink text-on-ink" : "border-line bg-card text-muted hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="cursor-pointer rounded-lg bg-accent px-4 py-2.5 text-[13px] font-semibold text-white transition hover:opacity-95 disabled:cursor-wait disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="cursor-pointer rounded-lg border border-line px-4 py-2.5 text-[13px] font-semibold text-ink transition hover:border-ink"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function Missing() {
  return (
    <section className="mx-auto max-w-[520px] py-16 text-center">
      <h1 className="font-serif text-[24px] font-semibold">This post isn&apos;t here any more</h1>
      <p className="mt-2 text-[14.5px] text-muted">It may have been deleted by its author or the hub team.</p>
      <Link
        href="/community"
        className="mt-5 inline-block rounded-lg bg-accent px-4 py-2.5 text-[13px] font-semibold text-white transition hover:opacity-95"
      >
        Back to Community
      </Link>
    </section>
  );
}
