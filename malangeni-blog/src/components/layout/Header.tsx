"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Container } from "./Container";
import { UserMenu } from "./UserMenu";
import { NotificationBell } from "./NotificationBell";
import { ThemeToggle } from "./ThemeToggle";
import { NAV_LINKS } from "@/lib/nav";
import { useAuth } from "@/lib/auth/AuthContext";
import { createPostHref } from "@/lib/posts";

/**
 * The top bar. Desktop: logo, the four sections, Create post, theme, bell and
 * account. Phones: the logo (left), theme and bell (right) — everything else
 * lives in the floating menu button (`MobileNav`).
 */
export function Header() {
  const pathname = usePathname();
  const { profile } = useAuth();
  const navRef = useRef<HTMLDivElement>(null);
  const underline = useRef<HTMLSpanElement>(null);
  const placed = useRef(false);

  // One underline that slides to the current section, instead of jumping between links.
  useEffect(() => {
    const place = () => {
      const nav = navRef.current;
      const line = underline.current;
      if (!nav || !line) return;
      const active = nav.querySelector<HTMLElement>('a[aria-current="page"]');
      if (!active) {
        line.style.opacity = "0";
        return;
      }
      // First placement (page load) appears in place; only later moves slide.
      const first = !placed.current;
      if (first) line.style.transition = "none";
      line.style.opacity = "1";
      line.style.width = `${active.offsetWidth}px`;
      line.style.transform = `translateX(${active.offsetLeft}px)`;
      if (first) {
        void line.offsetWidth;
        line.style.transition = "";
        placed.current = true;
      }
    };
    place();
    // The web font can change the links' widths once it loads.
    void document.fonts?.ready.then(place);
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-paper/85 backdrop-blur-[10px]">
      <Container>
        <nav className="flex h-[70px] items-center gap-2">
          <Link
            href="/"
            aria-label="Malangeni Hub home"
            className="grid size-11 place-items-center rounded-full border-[1.5px] border-ink font-serif text-[15px] font-extrabold tracking-[0.5px]"
          >
            MB
          </Link>

          <div ref={navRef} className="relative mx-auto hidden gap-[34px] md:flex">
            {NAV_LINKS.map((link) => {
              const active =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`py-1 text-[15px] font-medium transition-colors duration-200 ${
                    active ? "text-ink" : "text-muted hover:text-ink"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <span
              ref={underline}
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-0.5 left-0 h-0.5 w-0 rounded-full bg-accent opacity-0 transition-[transform,width,opacity] duration-300 ease-out motion-reduce:transition-none"
            />
          </div>

          <div className="ml-auto flex items-center gap-2.5 md:ml-0 md:gap-[14px]">
            {/* Posting from any page; the composer page itself guards sign-in too. */}
            {profile && (
              <Link
                href={createPostHref(pathname)}
                aria-label="Create a post"
                className="hidden items-center gap-1.5 rounded-full bg-accent px-3.5 py-2 text-[13px] font-semibold text-white transition hover:opacity-95 md:inline-flex"
              >
                <svg
                  className="size-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Create post
              </Link>
            )}
            <ThemeToggle />
            <NotificationBell />
            <span className="hidden md:contents">
              <UserMenu />
            </span>
          </div>
        </nav>
      </Container>
    </header>
  );
}
