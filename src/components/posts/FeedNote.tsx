/** The loading / empty / error line shown in place of a list. */
export function FeedNote({
  children,
  tone = "plain",
  onRetry,
  className = "",
}: {
  children: React.ReactNode;
  tone?: "plain" | "empty" | "error";
  onRetry?: () => void;
  className?: string;
}) {
  const box =
    tone === "plain"
      ? "py-6 text-muted"
      : tone === "error"
        ? "rounded-xl border border-accent bg-accent-soft p-6 text-accent"
        : "rounded-xl border border-dashed border-line bg-card p-6 text-muted";
  return (
    <div role={tone === "error" ? "alert" : undefined} className={`col-span-full text-center text-[14px] ${box} ${className}`}>
      {children}
      {onRetry && (
        <>
          {" "}
          <button type="button" onClick={onRetry} className="cursor-pointer font-semibold underline">
            Try again
          </button>
        </>
      )}
    </div>
  );
}
