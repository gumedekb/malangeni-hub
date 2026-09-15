"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { canModerate } from "@/lib/auth/types";
import { nameOf, profileHref } from "@/lib/users";
import { Avatar } from "@/components/ui/Avatar";

export function UserMenu() {
  const { firebaseUser, profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const picture = profile?.avatarUrl ?? firebaseUser?.photoURL ?? null;
  const name = profile ? nameOf(profile) : null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="cursor-pointer rounded-full transition hover:opacity-90"
      >
        <Avatar src={picture} name={name} size={30} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+10px)] z-30 w-56 overflow-hidden rounded-xl border border-line bg-card shadow-[0_12px_32px_rgba(0,0,0,0.12)]"
        >
          {profile ? (
            <>
              <div className="border-b border-line px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold">{name}</span>
                  {canModerate(profile) && (
                    <span className="shrink-0 rounded-full bg-tag px-2 py-[2px] text-[10px] font-semibold uppercase tracking-[0.5px] text-gold">
                      {profile.role}
                    </span>
                  )}
                </div>
                <div className="truncate text-xs text-muted">{profile.email}</div>
              </div>
              <MenuLink href="/profile" onClick={() => setOpen(false)}>
                Your profile
              </MenuLink>
              <MenuLink href={profileHref(profile.username)} onClick={() => setOpen(false)}>
                How others see you
              </MenuLink>
              <MenuLink href="/community/new" onClick={() => setOpen(false)}>
                Create a post
              </MenuLink>
              {canModerate(profile) && (
                <MenuLink href="/staff" onClick={() => setOpen(false)}>
                  Hub team tools
                </MenuLink>
              )}
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  void signOut();
                  setOpen(false);
                  router.push("/");
                }}
                className="block w-full cursor-pointer px-4 py-2.5 text-left text-sm text-accent transition hover:bg-accent-soft"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <div className="border-b border-line px-4 py-3">
                <div className="text-sm font-semibold">Welcome</div>
                <div className="text-xs text-muted">Sign in to post, join groups and list your services.</div>
              </div>
              <MenuLink href="/login" onClick={() => setOpen(false)} className="text-accent">
                Sign in with Google
              </MenuLink>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function MenuLink({
  href,
  onClick,
  className = "",
  children,
}: {
  href: string;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className={`block px-4 py-2.5 text-sm transition hover:bg-paper ${className}`}
    >
      {children}
    </Link>
  );
}
