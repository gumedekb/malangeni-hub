/** Eyebrow + big serif title + supporting line, shared by the inner pages. */
export function PageHead({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="pb-2 pt-[38px]">
      <span className="text-[11px] font-semibold uppercase tracking-[1.5px] text-gold">
        {eyebrow}
      </span>
      <h1 className="mt-1.5 font-serif text-[34px] font-semibold tracking-[-0.5px] sm:text-[46px]">
        {title}
      </h1>
      <p className="mt-1 max-w-[560px] text-[15px] text-muted">{description}</p>
    </section>
  );
}
