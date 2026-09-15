import Image from "next/image";
import type { Badge, Role } from "@/lib/auth/types";

/**
 * The badges shown next to someone's name. Two badges, two images in
 * `public/badge/`:
 *   - **Hub team** (gold, `money_admin.png`) — derived from `role`. Admins and
 *     moderators deliberately share one badge: the difference is internal
 *     permissions, which means nothing to a reader — and labelling accounts
 *     "ADMIN" in public just tells an attacker which one to go after.
 *   - **Local business** (blue, `money.png`) — business owners and shop owners
 *     share it. Comes from the `badge` field, set when a moderator or admin has
 *     confirmed the business is real.
 *
 * Each badge is image *and* label: a bare icon nobody recognises makes people
 * hover and guess, and gives screen readers nothing to announce.
 */

export function UserBadges({
  role,
  badge,
  className = "",
}: {
  role?: Role | string | null;
  badge?: Badge | string | null;
  className?: string;
}) {
  const isTeam = role === "ADMIN" || role === "MODERATOR";
  const isBusiness = badge === "BUSINESS" || role === "BUSINESS_OWNER";

  if (!isTeam && !isBusiness) return null;

  return (
    <span className={`inline-flex flex-wrap items-center gap-1.5 ${className}`}>
      {isTeam && (
        <Pill
          label="Hub team"
          title="Helps run Malangeni Hub"
          image="/badge/money_admin.png"
          className="bg-tag text-gold"
        />
      )}
      {isBusiness && (
        <Pill
          label="Local business"
          // Wording matters: we confirmed who they are, not how they trade.
          title="The hub team confirmed this business exists and who runs it — not its prices or service"
          image="/badge/money.png"
          className="bg-info-soft text-info"
        />
      )}
    </span>
  );
}

function Pill({
  label,
  title,
  image,
  className,
}: {
  label: string;
  title: string;
  image: string;
  className: string;
}) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 rounded-full py-[2px] pl-[3px] pr-2 text-[11px] font-semibold ${className}`}
    >
      <Image
        src={image}
        alt=""
        width={16}
        height={16}
        className="size-4 shrink-0"
      />
      {label}
    </span>
  );
}
