import type { ElementType, ReactNode } from "react";

/** Centered page-width wrapper (max 1180px) used across all pages. */
export function Container({
  as: Tag = "div",
  className = "",
  children,
}: {
  as?: ElementType;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag className={`mx-auto w-full max-w-[1180px] px-6 ${className}`}>
      {children}
    </Tag>
  );
}
