import type { PostType } from "./types";

/** The tags a member can choose when posting. COMMUNITY is shown as "Discussion". */
export const POST_TAGS: { type: PostType; label: string }[] = [
  { type: "COMMUNITY", label: "Discussion" },
  { type: "NEWS", label: "News" },
  { type: "NOTICE", label: "Notice" },
  { type: "JOB", label: "Job" },
];

export function postTypeLabel(type: PostType): string {
  return POST_TAGS.find((t) => t.type === type)?.label ?? "Info";
}

/** The composer; on a group's page it opens with that group already picked. */
export function createPostHref(pathname: string): string {
  const group = pathname.match(/^\/community\/groups\/([^/?#]+)/);
  return group ? `/community/new?group=${group[1]}` : "/community/new";
}

/** Where a post lives on the site — also the link people share. */
export function postPath(id: string): string {
  return `/community/${encodeURIComponent(id)}`;
}
