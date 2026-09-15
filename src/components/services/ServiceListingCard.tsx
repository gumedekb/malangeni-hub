import Image from "next/image";
import Link from "next/link";
import { fillImage } from "@/lib/cloudinary";
import { categoryInfo } from "@/lib/services";
import { nameOf, profileHref } from "@/lib/users";
import type { ApiService } from "@/lib/types";
import { UserBadges } from "@/components/ui/UserBadges";

/** One member-offered service in the directory. */
export function ServiceListingCard({ service }: { service: ApiService }) {
  const category = categoryInfo(service.serviceCategory);
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-line bg-card transition hover:-translate-y-0.5 hover:shadow-[0_6px_22px_rgba(0,0,0,0.07)]">
      {service.imageUrl && (
        // Cloudinary crops to the card's exact shape and keeps the subject (g_auto), so the
        // browser shows it as-is instead of cutting it again.
        <Image
          src={fillImage(service.imageUrl, 800, 450)}
          alt=""
          width={800}
          height={450}
          unoptimized
          className="aspect-video h-auto w-full object-cover"
        />
      )}
      <div className="flex flex-1 flex-col p-[22px]">
        <div className="mb-3 flex items-center gap-3">
          {!service.imageUrl && (
            <div className="grid size-[46px] shrink-0 place-items-center rounded-[11px] bg-accent-soft text-[22px]">
              {category.icon}
            </div>
          )}
          <span className="rounded-full bg-tag px-2.5 py-[3px] text-[10px] font-semibold uppercase tracking-[0.5px] text-gold">
            {category.label}
          </span>
        </div>

        <h3 className="mb-1.5 font-serif text-[19px] font-semibold">{service.name}</h3>
        <p className="flex-1 whitespace-pre-line text-[13.5px] text-muted">{service.description}</p>

        <dl className="mt-3.5 flex flex-col gap-1 text-xs text-muted">
          {service.areaServed && (
            <div>
              <span aria-hidden="true">📍 </span>
              {service.areaServed}
            </div>
          )}
          {service.operatingHours && (
            <div>
              <span aria-hidden="true">🕒 </span>
              {service.operatingHours}
            </div>
          )}
          {service.provider && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span>
                By{" "}
                <Link
                  href={profileHref(service.provider.username)}
                  className="font-semibold text-ink hover:underline"
                >
                  {nameOf(service.provider)}
                </Link>
              </span>
              <UserBadges role={service.provider.role} badge={service.provider.badge} />
            </div>
          )}
        </dl>

        {service.contactNumber && (
          <a
            href={`tel:${service.contactNumber}`}
            className="mt-3.5 rounded-[9px] border border-ink p-2.5 text-center text-[13.5px] font-semibold text-ink transition hover:bg-ink hover:text-on-ink"
          >
            Call {service.contactNumber}
          </a>
        )}
      </div>
    </article>
  );
}
