/** Full-width sponsored ad slot with the dashed "placeholder" stripe. */
export function SponsorStrip({ pitch }: { pitch: string }) {
  return (
    <section className="mt-[26px] flex flex-col items-start justify-between gap-4 rounded-card border border-dashed border-line bg-[repeating-linear-gradient(45deg,var(--color-card),var(--color-card)_12px,var(--color-paper)_12px,var(--color-paper)_24px)] px-[22px] py-[18px] sm:flex-row sm:items-center">
      <span className="text-[11px] uppercase tracking-[1.5px] text-muted">
        Sponsored
      </span>
      <span className="font-serif text-lg font-semibold text-muted">
        {pitch}
      </span>
      <span className="text-[11px] uppercase tracking-[1.5px] text-muted">
        728 × 90
      </span>
    </section>
  );
}
