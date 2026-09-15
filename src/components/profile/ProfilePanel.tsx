"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, MEMBER_ENDPOINTS } from "@/lib/api";
import { useAuth } from "@/lib/auth/AuthContext";
import { AVATAR_ACCEPT, AvatarError } from "@/lib/avatar";
import { usePostFeed } from "@/lib/usePostFeed";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { Avatar } from "@/components/ui/Avatar";
import { ImageCropDialog, SQUARE } from "@/components/ui/ImageCropDialog";
import { UserBadges } from "@/components/ui/UserBadges";
import { FeedNote } from "@/components/posts/FeedNote";
import { LoadMore } from "@/components/posts/LoadMore";
import { PostCard } from "@/components/posts/PostCard";
import { BadgeRequestForm } from "./BadgeRequestForm";
import { BusinessListingCard } from "./BusinessListingCard";

/** Before cropping; the cropped picture that's uploaded is much smaller. */
const MAX_PICK_BYTES = 15 * 1024 * 1024;

/**
 * The member's own profile: their identity and picture on the left, everything
 * they've posted on the right.
 *
 * The name shown is the Google account's name (kept in step by the backend on
 * every sign-in). The username is not editable here — only an admin can change
 * it. Email and role aren't editable either.
 */
export function ProfilePanel() {
  return (
    <RequireAuth>
      <ProfileForCurrentAccount />
    </RequireAuth>
  );
}

/** Remounts if the account changes, which re-seeds everything from scratch. */
function ProfileForCurrentAccount() {
  const { profile } = useAuth();
  return <ProfileEditor key={String(profile?.id)} />;
}

function ProfileEditor() {
  const { firebaseUser, profile: maybeProfile, uploadAvatar, removeAvatar } = useAuth();
  // RequireAuth only renders this once the profile exists.
  const profile = maybeProfile!;

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const picture = profile.avatarUrl ?? firebaseUser?.photoURL ?? null;
  const displayName = profile.displayName || firebaseUser?.displayName || profile.username;

  // Picking a file opens the cropper; the member frames it before anything is uploaded.
  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Let the same file be chosen again after cancelling.
    e.target.value = "";
    if (!file) return;
    setSaved(false);
    if (!AVATAR_ACCEPT.split(",").includes(file.type)) {
      setError("Please choose a JPEG, PNG or WebP image.");
      return;
    }
    if (file.size > MAX_PICK_BYTES) {
      setError("That image is too large — please choose one under 15 MB.");
      return;
    }
    setError(null);
    setCropFile(file);
  }

  async function uploadCropped(file: File) {
    setCropFile(null);
    setUploading(true);
    try {
      // One call uploads the image and persists it — the backend returns the
      // updated record, which the context adopts.
      await uploadAvatar(file);
      setSaved(true);
    } catch (err) {
      setError(err instanceof AvatarError || err instanceof Error ? err.message : "Could not upload that picture.");
    } finally {
      setUploading(false);
    }
  }

  async function onRemovePicture() {
    setError(null);
    setSaved(false);
    setUploading(true);
    try {
      await removeAvatar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove your picture.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 pb-16 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:items-start">
      {/* Left column — identity and account */}
      <div className="flex flex-col gap-5">
        {error && (
          <p role="alert" className="rounded-lg border border-accent bg-accent-soft px-3.5 py-2.5 text-[13px] text-accent">
            {error}
          </p>
        )}
        {saved && !error && (
          <p role="status" className="rounded-lg border border-line bg-fun-soft px-3.5 py-2.5 text-[13px] text-fun">
            Saved.
          </p>
        )}

        {/* Identity + picture */}
        <section className="rounded-card border border-line bg-card p-6">
          <div className="flex items-center gap-4">
            <Avatar src={picture} name={displayName} size={72} />
            <div className="min-w-0">
              <h2 className="truncate font-serif text-[22px] font-semibold">{displayName}</h2>
              <p className="text-[13px] text-muted">@{profile.username}</p>
              <UserBadges role={profile.role} badge={profile.badge} className="mt-1.5" />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={uploading}
              className="cursor-pointer rounded-lg bg-accent px-4 py-2.5 text-[13px] font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploading ? "Uploading…" : picture ? "Change picture" : "Upload picture"}
            </button>
            {/* Nothing to remove when the picture is just the Google photo. */}
            {profile.avatarUrl && !profile.avatarUrl.includes("googleusercontent.com") && (
              <button
                type="button"
                onClick={() => void onRemovePicture()}
                disabled={uploading}
                className="cursor-pointer rounded-lg border border-line px-4 py-2.5 text-[13px] font-semibold text-ink transition hover:border-ink disabled:cursor-not-allowed disabled:opacity-60"
              >
                Remove
              </button>
            )}
          </div>
          <p className="mt-3 text-[12.5px] text-muted">
            JPEG, PNG or WebP. You&apos;ll frame it first, and it&apos;s resized on your phone so it won&apos;t eat your data.
          </p>
          <input ref={fileInput} type="file" accept={AVATAR_ACCEPT} onChange={onPickFile} className="hidden" />
        </section>

        {/* Read-only account facts */}
        <section className="rounded-card border border-line bg-card p-6">
          <h2 className="font-serif text-[20px] font-semibold">Account</h2>
          <dl className="mt-3 flex flex-col gap-3">
            <Row label="Name">
              <span className="text-[14px]">{displayName}</span>
              <p className="mt-0.5 text-[12.5px] text-muted">From your Google account — change it there.</p>
            </Row>
            <Row label="Email">
              <span className="text-[14px]">{profile.email}</span>
              <p className="mt-0.5 text-[12.5px] text-muted">Managed by your Google account — it can&apos;t be changed here.</p>
            </Row>
            {/*
              "USER" tells nobody anything — it's the default everyone has. Only
              surface a role when it actually means something, and let the badge
              beside the name carry it the rest of the time.
            */}
            {(profile.role === "ADMIN" || profile.role === "MODERATOR") && (
              <Row label="Role">
                <span className="text-[14px]">{profile.role}</span>
              </Row>
            )}
            <Row label="Member since">
              <span className="text-[14px]">
                {new Date(profile.createdAt).toLocaleDateString("en-ZA", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </Row>
          </dl>
        </section>

        <BadgeRequestForm />
        <BusinessListingCard />
        <DeleteAccount />
      </div>

      {/* Right column — the member's posts */}
      <OwnPosts authorId={profile.id} />

      {cropFile && (
        <ImageCropDialog
          file={cropFile}
          shapes={SQUARE}
          round
          title="Frame your profile picture"
          onCancel={() => setCropFile(null)}
          onDone={(cropped) => void uploadCropped(cropped)}
        />
      )}
    </div>
  );
}

/**
 * Deleting the account removes it and everything the member posted. Typing
 * DELETE is the safety catch. Admin accounts come from backend configuration,
 * so they can't be deleted here.
 */
function DeleteAccount() {
  const { profile, signOut } = useAuth();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!profile) return null;

  if (profile.role === "ADMIN") {
    return (
      <section className="rounded-card border border-line bg-card p-6">
        <h2 className="font-serif text-[20px] font-semibold">Delete account</h2>
        <p className="mt-2 text-[13.5px] text-muted">
          Admin accounts are set in the backend configuration (ADMIN_EMAILS), so they can&apos;t be deleted here.
        </p>
      </section>
    );
  }

  async function remove() {
    if (!profile) return;
    setError(null);
    setBusy(true);
    try {
      await api.del(MEMBER_ENDPOINTS.account(profile.id));
      await signOut();
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete your account.");
      setBusy(false);
    }
  }

  return (
    <section className="rounded-card border border-accent/40 bg-card p-6">
      <h2 className="font-serif text-[20px] font-semibold">Delete account</h2>
      <p className="mt-2 text-[13.5px] text-muted">
        This removes your account and everything you&apos;ve posted — posts, comments, likes, events, services and
        listings. It can&apos;t be undone.
      </p>
      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="mt-4 cursor-pointer rounded-lg border border-accent px-4 py-2.5 text-[13px] font-semibold text-accent transition hover:bg-accent-soft"
        >
          Delete my account
        </button>
      ) : (
        <div className="mt-4">
          <label htmlFor="confirm-delete" className="mb-1.5 block text-[13px] font-medium">
            Type <strong>DELETE</strong> to confirm
          </label>
          <input
            id="confirm-delete"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            className="w-full rounded-[10px] border border-line bg-paper px-4 py-3 text-[14px] outline-none transition focus:border-accent"
          />
          {error && (
            <p role="alert" className="mt-2 text-[13px] text-accent">
              {error}
            </p>
          )}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={typed !== "DELETE" || busy}
              onClick={() => void remove()}
              className="cursor-pointer rounded-lg bg-accent px-4 py-2.5 text-[13px] font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Deleting…" : "Delete forever"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setConfirming(false);
                setTyped("");
                setError(null);
              }}
              className="cursor-pointer rounded-lg border border-line px-4 py-2.5 text-[13px] font-semibold text-ink transition hover:border-ink"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

/**
 * The member's own posts, or a friendly placeholder when they have none — the
 * right column would otherwise be a large empty gap beside the profile cards.
 */
function OwnPosts({ authorId }: { authorId: number | string }) {
  const feed = usePostFeed({ authorId });

  return (
    <section>
      <h2 className="font-serif text-[20px] font-semibold">Your posts{feed.total ? ` (${feed.total})` : ""}</h2>

      <div className="mt-3 flex flex-col gap-4">
        {feed.loading ? (
          <FeedNote>Loading…</FeedNote>
        ) : feed.error && feed.posts.length === 0 ? (
          <FeedNote tone="error" onRetry={feed.reload}>
            {feed.error}
          </FeedNote>
        ) : feed.posts.length === 0 ? (
          <EmptyPosts />
        ) : (
          feed.posts.map((post) => (
            <PostCard key={post.id} post={post} onChange={feed.update} onDelete={feed.remove} />
          ))
        )}
        <LoadMore hasMore={feed.hasMore} loading={feed.loadingMore} onLoadMore={feed.loadMore} />
      </div>
    </section>
  );
}

/** A considered blank state, so an empty feed still feels like part of the page. */
function EmptyPosts() {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-line bg-card px-6 py-16 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-accent-soft text-accent">
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
      </span>
      <h3 className="mt-4 font-serif text-[18px] font-semibold">No posts yet</h3>
      <p className="mt-1.5 max-w-[320px] text-[13.5px] text-muted">
        When you share something with the community, it&apos;ll show up here for everyone to see.
      </p>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-line pb-3 last:border-0 last:pb-0">
      <dt className="text-[12px] font-semibold uppercase tracking-[0.5px] text-muted">{label}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}
