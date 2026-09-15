"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api, POST_ENDPOINTS } from "@/lib/api";
import { useAuth } from "@/lib/auth/AuthContext";
import { IMAGE_ACCEPT, imageProblem, prepareImage } from "@/lib/images";
import { POST_TAGS, postTypeLabel } from "@/lib/posts";
import { asPublicUser, loginHref, nameOf } from "@/lib/users";
import type { ApiGroup, ApiPost, PostType } from "@/lib/types";
import { Avatar } from "@/components/ui/Avatar";
import { FilePreview } from "@/components/ui/FilePreview";

/**
 * Write a post: a title, optional details and picture, a tag (Discussion /
 * News / Notice / Job) and optionally a group. Inline on the Community page,
 * and full-size on /community/new (the header's "Create post" button), which
 * pre-picks the group when you came from a group's page.
 */
export function PostComposer({
  groups,
  onPosted,
  startExpanded = false,
  defaultGroupId = "",
}: {
  groups: ApiGroup[] | null;
  onPosted: (post: ApiPost) => void;
  /** Open with every field showing and no "Close" (the /community/new page). */
  startExpanded?: boolean;
  /** Group picked to start with, e.g. `/community/new?group=…`. */
  defaultGroupId?: string;
}) {
  const { firebaseUser, profile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tag, setTag] = useState<PostType>("COMMUNITY");
  const [groupId, setGroupId] = useState(defaultGroupId);
  const [expanded, setExpanded] = useState(startExpanded);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [image, setImage] = useState<File | null>(null);

  const groupList = groups ?? [];
  // A group id from the URL that no longer exists is dropped rather than sent.
  const chosenGroup = groups === null || groupList.some((g) => g.id === groupId) ? groupId : "";

  function pickImage(file: File | null) {
    if (!file) return;
    const problem = imageProblem(file);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setImage(file);
  }

  async function submit() {
    // Posting identifies the current user — require sign-in.
    if (!profile) {
      router.push(loginHref(pathname));
      return;
    }
    if (!title.trim()) {
      setExpanded(true);
      setError("Give your post a title.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      let saved = await api.post<ApiPost>(POST_ENDPOINTS.create, {
        title: title.trim(),
        body: body.trim(),
        type: tag,
        groupId: chosenGroup || undefined,
      });
      // The post exists first; the picture is attached to it afterwards.
      let imageFailed = false;
      if (image) {
        try {
          const form = new FormData();
          form.append("file", await prepareImage(image));
          saved = await api.postForm<ApiPost>(POST_ENDPOINTS.image(saved.id), form);
        } catch (err) {
          imageFailed = true;
          setError(`Your post was shared, but the picture didn't upload${err instanceof Error ? `: ${err.message}` : "."}`);
        }
      }
      onPosted({ ...saved, author: saved.author ?? asPublicUser(profile) });
      setTitle("");
      setBody("");
      setTag("COMMUNITY");
      setGroupId(defaultGroupId);
      setImage(null);
      if (!imageFailed && !startExpanded) setExpanded(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not share your post.");
    } finally {
      setSubmitting(false);
    }
  }

  const picture = profile?.avatarUrl ?? firebaseUser?.photoURL ?? null;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      className="rounded-xl border border-line bg-card p-4"
    >
      <div className="flex items-center gap-3">
        <Avatar src={picture} name={profile ? nameOf(profile) : null} size={38} />
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => profile && setExpanded(true)}
          maxLength={255}
          aria-label="Post title"
          placeholder={profile ? "Share something with the community…" : "Sign in to share something with the community…"}
          className="min-w-0 flex-1 rounded-3xl border border-line bg-paper px-4 py-2.5 text-sm outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={submitting || (!!profile && !title.trim())}
          className="cursor-pointer rounded-3xl bg-accent px-[18px] py-2.5 text-[13px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Posting…" : "Post"}
        </button>
      </div>

      {error && !(expanded && profile) && (
        <p role="alert" className="mt-3 text-[13px] text-accent">
          {error}
        </p>
      )}

      {expanded && profile && (
        <div className="mt-3 flex flex-col gap-3 border-t border-line pt-3">
          {error && (
            <p role="alert" className="rounded-lg border border-accent bg-accent-soft px-3.5 py-2.5 text-[13px] text-accent">
              {error}
            </p>
          )}
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={startExpanded ? 6 : 3}
            aria-label="Post details"
            placeholder="Add details (optional)"
            className="w-full rounded-[10px] border border-line bg-paper px-4 py-3 text-sm outline-none focus:border-accent"
          />

          <div>
            <div className="mb-1.5 text-[12px] font-semibold uppercase tracking-[0.5px] text-muted">Picture (optional)</div>
            {image ? (
              <div>
                <FilePreview file={image} className="h-auto max-h-48 w-auto rounded-lg border border-line" />
                <button
                  type="button"
                  onClick={() => setImage(null)}
                  className="mt-1.5 cursor-pointer text-[12.5px] font-semibold text-accent"
                >
                  Remove picture
                </button>
              </div>
            ) : (
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line px-3.5 py-2 text-[13px] font-semibold text-ink transition hover:border-ink">
                <span aria-hidden="true">📷</span> Add a picture
                <input
                  type="file"
                  accept={IMAGE_ACCEPT}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    // Let the same file be chosen again after removing it.
                    e.target.value = "";
                    pickImage(file);
                  }}
                />
              </label>
            )}
            <p className="mt-1 text-[12px] text-muted">
              JPEG, PNG or WebP. It&apos;s shown whole, and resized on your phone before uploading.
            </p>
          </div>

          <div>
            <div className="mb-1.5 text-[12px] font-semibold uppercase tracking-[0.5px] text-muted">Tag</div>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Post tag">
              {POST_TAGS.map((t) => (
                <button
                  key={t.type}
                  type="button"
                  role="radio"
                  aria-checked={tag === t.type}
                  onClick={() => setTag(t.type)}
                  className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-[13px] transition ${
                    tag === t.type ? "border-ink bg-ink text-on-ink" : "border-line bg-card text-muted hover:text-ink"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {tag !== "COMMUNITY" && (
              <p className="mt-1.5 text-[12px] text-muted">
                Also listed on the home feed under {postTypeLabel(tag)}
                {tag === "NEWS" ? "" : "s"}.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="post-group" className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.5px] text-muted">
              Group
            </label>
            <select
              id="post-group"
              value={chosenGroup}
              onChange={(e) => setGroupId(e.target.value)}
              disabled={groupList.length === 0}
              className="w-full cursor-pointer rounded-[10px] border border-line bg-paper px-4 py-2.5 text-sm outline-none focus:border-accent disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              <option value="">{groups === null ? "Loading groups…" : groupList.length === 0 ? "No groups yet" : "No group"}</option>
              {groupList.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.icon ? `${g.icon} ` : ""}
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {!startExpanded && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setExpanded(false);
                  setError(null);
                }}
                className="cursor-pointer text-[13px] font-semibold text-muted hover:text-ink"
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}
    </form>
  );
}
