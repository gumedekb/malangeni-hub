"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api, POST_ENDPOINTS } from "@/lib/api";
import { useAuth } from "@/lib/auth/AuthContext";
import { loginHref } from "@/lib/users";
import type { ApiPost, LikeSummary } from "@/lib/types";

/** Like or unlike, saved to the backend. Changes at once, then settles on the server's count. */
export function LikeButton({ post, onChange }: { post: ApiPost; onChange: (post: ApiPost) => void }) {
  const { firebaseUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (!firebaseUser) {
      router.push(loginHref(pathname));
      return;
    }
    if (busy) return;
    const liking = !post.likedByCurrentUser;
    const optimistic: ApiPost = {
      ...post,
      likedByCurrentUser: liking,
      likeCount: Math.max(0, post.likeCount + (liking ? 1 : -1)),
    };
    onChange(optimistic);
    setBusy(true);
    try {
      const summary = liking
        ? await api.post<LikeSummary>(POST_ENDPOINTS.likes(post.id))
        : await api.del<LikeSummary>(POST_ENDPOINTS.likes(post.id));
      if (summary) {
        onChange({ ...optimistic, likeCount: summary.likeCount, likedByCurrentUser: summary.likedByCurrentUser });
      }
    } catch {
      onChange(post); // put it back; they can try again
    } finally {
      setBusy(false);
    }
  }

  const liked = !!post.likedByCurrentUser;
  return (
    <button
      type="button"
      onClick={() => void toggle()}
      aria-pressed={liked}
      className={`inline-flex cursor-pointer items-center gap-1 transition ${liked ? "text-accent" : "hover:text-ink"}`}
    >
      <span aria-hidden="true">{liked ? "♥" : "♡"}</span>
      {post.likeCount} like{post.likeCount === 1 ? "" : "s"}
    </button>
  );
}
