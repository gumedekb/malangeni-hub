import Link from "next/link";
import { timeAgo } from "@/lib/dates";
import { nameOf, profileHref } from "@/lib/users";
import type { PublicUser } from "@/lib/types";
import { Avatar } from "@/components/ui/Avatar";
import { UserBadges } from "@/components/ui/UserBadges";

/** Who wrote something and when: picture, Google name, badges and a relative time. */
export function Byline({
  user,
  createdAt,
  size = 34,
}: {
  user?: PublicUser | null;
  createdAt?: string;
  size?: number;
}) {
  const name = nameOf(user);
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <Avatar src={user?.avatarUrl} name={name} size={size} />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          {user ? (
            <Link href={profileHref(user.username)} className="truncate text-sm font-semibold hover:underline">
              {name}
            </Link>
          ) : (
            <span className="text-sm font-semibold">Member</span>
          )}
          <UserBadges role={user?.role} badge={user?.badge} />
        </div>
        {createdAt && (
          <time dateTime={createdAt} className="block text-xs text-muted">
            {timeAgo(createdAt)}
          </time>
        )}
      </div>
    </div>
  );
}
