"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Container } from "./Container";
import { UserMenu } from "./UserMenu";
import { MobileNav } from "./MobileNav";
import { NotificationBell } from "./NotificationBell";
import { ThemeToggle } from "./ThemeToggle";
import { NAV_LINKS } from "@/lib/nav";
import { useAuth } from "@/lib/auth/AuthContext";
import { createPostHref } from "@/lib/posts";

export function Header() {
  const pathname = usePathname();
  const { profile } = useAuth();

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-paper/85 backdrop-blur-[10px]">
      <Container>
        <nav className="flex h-[70px] items-center gap-2">
          <MobileNav />
          <Link
            href="/"
            aria-label="Malangeni Hub home"
            className="grid size-11 place-items-center rounded-full border-[1.5px] border-ink font-serif text-[15px] font-extrabold tracking-[0.5px]"
          >
            MB
          </Link>

          <div className="mx-auto hidden gap-[34px] md:flex">
            {NAV_LINKS.map((link) => {
              const active =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative py-1 text-[15px] font-medium transition-colors ${
                    active ? "text-ink" : "text-muted hover:text-ink"
                  } ${
                    active
                      ? "after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:bg-accent after:content-['']"
                      : ""
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="ml-auto flex items-center gap-2.5 md:ml-0 md:gap-[14px]">
            {/* Posting from any page; the composer page itself guards sign-in too. */}
            {profile && (
              <Link
                href={createPostHref(pathname)}
                aria-label="Create a post"
                className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-2 text-[13px] font-semibold text-white transition hover:opacity-95 sm:px-3.5"
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
                <span className="hidden sm:inline">Create post</span>
              </Link>
            )}
            <ThemeToggle />
            <NotificationBell />
            <UserMenu />
          </div>
        </nav>
      </Container>
    </header>
  );
}
