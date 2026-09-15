"use client";

import { useRouter } from "next/navigation";
import { postPath } from "@/lib/posts";
import { useGroups } from "@/lib/useGroups";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { PostComposer } from "./PostComposer";

/**
 * The full-page composer behind the header's "Create post" button. Coming from
 * a group's page pre-picks that group. Opens the post once it's shared.
 */
export function NewPost({ defaultGroupId }: { defaultGroupId?: string }) {
  const router = useRouter();
  const groups = useGroups();
  return (
    <RequireAuth>
      <div className="mx-auto w-full max-w-[720px] pb-16">
        <PostComposer
          groups={groups}
          startExpanded
          defaultGroupId={defaultGroupId}
          onPosted={(post) => router.push(postPath(post.id))}
        />
      </div>
    </RequireAuth>
  );
}
