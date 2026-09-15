"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { NAV_LINKS } from "@/lib/nav";
import { useAuth } from "@/lib/auth/AuthContext";
import { canModerate } from "@/lib/auth/types";
import { createPostHref } from "@/lib/posts";
import { loginHref, nameOf } from "@/lib/users";
import { Avatar } from "@/components/ui/Avatar";

/**
 * Phones: a floating "Menu" button in the bottom-right corner that opens a
 * small menu box above it — your profile (or sign in), the four sections, then
 * Create post, Hub team tools and sign out. The header keeps the logo, the
 * theme toggle and the notification bell. Hidden from `md` up, where the
 * header has room for everything.
 *
 * Rendered from the layout, not the header: the header's backdrop blur would
 * otherwise pin this `fixed` button to the header instead of the screen.
 */

/** Minimal glyphs keyed by nav href, to make the tiles scannable. */
const NAV_ICONS: Record<string, React.ReactNode> = {
  "/": <path d="M3 11l9-8 9 8M5 9.5V21h14V9.5" />,
  "/explore": (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </>
  ),
  "/community": (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <path d="M16 4.5a3.2 3.2 0 0 1 0 6.3M21 20c0-2.5-1.4-4.7-3.5-5.6" />
    </>
  ),
  "/services": <path d="M4 7h16M4 12h16M4 17h10" />,
};

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { firebaseUser, profile, signOut } = useAuth();
  // Remembers which page the menu was opened on, so it closes by itself when the route changes.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const ref = useRef<HTMLDivElement>(null);

  const close = () => setOpenOn(null);

  // Close on a tap anywhere outside the button and the box, or on Escape.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpenOn(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenOn(null);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="md:hidden">
      {open && (
        <div
          id="mobile-menu"
          role="menu"
          aria-label="Menu"
          className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-40 w-[260px] max-w-[calc(100vw-32px)] origin-bottom-right animate-menu-in rounded-2xl border border-line bg-card p-2 shadow-[0_18px_48px_rgba(0,0,0,0.22)] motion-reduce:animate-none"
        >
          {/* Account */}
          {profile ? (
            <Link
              href="/profile"
              role="menuitem"
              onClick={close}
              className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition hover:bg-paper"
            >
              <Avatar src={profile.avatarUrl ?? firebaseUser?.photoURL} name={nameOf(profile)} size={32} />
              <div className="min-w-0">
                <div className="truncate text-[13.5px] font-semibold">{nameOf(profile)}</div>
                <div className="text-[11.5px] text-muted">Your profile</div>
              </div>
            </Link>
          ) : (
            <Link
              href={loginHref(pathname)}
              role="menuitem"
              onClick={close}
              className="block rounded-xl bg-accent px-3 py-2.5 text-center text-[13.5px] font-semibold text-white transition hover:opacity-95"
            >
              Sign in with Google
            </Link>
          )}

          {/* The four sections, as compact tiles */}
          <nav className="mt-2 grid grid-cols-2 gap-1 border-t border-line pt-2">
            {NAV_LINKS.map((link) => {
              const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  role="menuitem"
                  onClick={close}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-2 rounded-xl px-2.5 py-2 text-[13px] font-medium transition ${
                    active ? "bg-accent-soft text-accent" : "text-ink hover:bg-paper"
                  }`}
                >
                  <Glyph>{NAV_ICONS[link.href]}</Glyph>
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="mt-2 flex flex-col gap-0.5 border-t border-line pt-2">
            {profile && (
              <Link
                href={createPostHref(pathname)}
                role="menuitem"
                onClick={close}
                className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-[13px] font-semibold text-accent transition hover:bg-accent-soft"
              >
                <Glyph>
                  <path d="M12 5v14M5 12h14" />
                </Glyph>
                Create a post
              </Link>
            )}
            {canModerate(profile) && (
              <Link
                href="/staff"
                role="menuitem"
                onClick={close}
                className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-[13px] font-medium text-ink transition hover:bg-paper"
              >
                <Glyph>
                  <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
                </Glyph>
                Hub team tools
              </Link>
            )}
            {profile && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  void signOut();
                  close();
                  router.push("/");
                }}
                className="flex cursor-pointer items-center gap-2 rounded-xl px-2.5 py-2 text-left text-[13px] font-medium text-accent transition hover:bg-accent-soft"
              >
                <Glyph>
                  <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11" />
                </Glyph>
                Sign out
              </button>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpenOn(open ? null : pathname)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="mobile-menu"
        className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] right-4 z-40 inline-flex h-12 cursor-pointer items-center gap-2 rounded-full bg-ink pl-4 pr-5 text-[14px] font-semibold text-on-ink shadow-[0_10px_28px_rgba(0,0,0,0.3)] transition active:scale-95"
      >
        <svg
          className={`size-5 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
        {open ? "Close" : "Menu"}
      </button>
    </div>
  );
}

function Glyph({ children }: { children: React.ReactNode }) {
  return (
    <svg
      className="size-[18px] shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}
