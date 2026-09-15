"use client";

import { useEffect, useState } from "react";
import { api, SHOP_ENDPOINTS } from "@/lib/api";
import { useAuth } from "@/lib/auth/AuthContext";
import { hhmm, hoursLabel } from "@/lib/shops";
import type { Shop, ShopInput } from "@/lib/types";

/**
 * A confirmed business owner's directory listing: name, hours, contact and
 * where to find them. Information only — the hub doesn't sell or take orders.
 * A new listing waits for the hub team to approve it; the owner can hide it
 * at any time without deleting it.
 */
export function BusinessListingCard() {
  const { profile } = useAuth();
  const isBusiness = profile?.badge === "BUSINESS";
  const [shop, setShop] = useState<Shop | null | undefined>(undefined);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isBusiness) return;
    let cancelled = false;
    void (async () => {
      try {
        const mine = await api.get<Shop[]>(SHOP_ENDPOINTS.mine);
        if (!cancelled) setShop(mine?.[0] ?? null);
      } catch {
        if (!cancelled) setShop(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isBusiness]);

  if (!isBusiness) return null;

  async function setActive(active: boolean) {
    if (!shop) return;
    setBusy(true);
    setError(null);
    try {
      setShop(await api.put<Shop>(SHOP_ENDPOINTS.active(shop.id, active)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the listing.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-5 rounded-card border border-line bg-card p-6">
      <h2 className="font-serif text-[20px] font-semibold">Business listing</h2>

      {shop === undefined ? (
        <p className="mt-2 text-[13px] text-muted">Loading…</p>
      ) : shop === null || editing ? (
        <>
          <p className="mt-2 text-[13px] text-muted">
            {shop
              ? "Update what customers see in the directory."
              : "List your business in the Malangeni directory so people can find you. The hub team approves new listings."}
          </p>
          <ListingForm
            key={shop?.id ?? "new"}
            shop={shop}
            onSaved={(saved) => {
              setShop(saved);
              setEditing(false);
            }}
            onCancel={shop ? () => setEditing(false) : undefined}
          />
        </>
      ) : (
        <>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[15px] font-semibold">{shop.name}</span>
            <StatusChip shop={shop} />
          </div>
          <dl className="mt-3 flex flex-col gap-1.5 text-[13.5px]">
            <div>
              <span className="text-muted">Hours: </span>
              {hoursLabel(shop)}
            </div>
            {shop.phone && (
              <div>
                <span className="text-muted">Phone: </span>
                {shop.phone}
              </div>
            )}
            {shop.address && (
              <div>
                <span className="text-muted">Where: </span>
                {shop.address}
              </div>
            )}
          </dl>
          {error && (
            <p role="alert" className="mt-3 text-[13px] text-accent">
              {error}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="cursor-pointer rounded-lg bg-accent px-4 py-2.5 text-[13px] font-semibold text-white transition hover:opacity-95"
            >
              Edit listing
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void setActive(!shop.active)}
              className="cursor-pointer rounded-lg border border-line px-4 py-2.5 text-[13px] font-semibold text-ink transition hover:border-ink disabled:opacity-60"
            >
              {shop.active ? "Hide listing" : "Show listing"}
            </button>
          </div>
        </>
      )}
    </section>
  );
}

function StatusChip({ shop }: { shop: Shop }) {
  const [label, cls] = !shop.approved
    ? ["Waiting for approval", "bg-paper text-muted"]
    : shop.active
      ? ["Listed", "bg-fun-soft text-fun"]
      : ["Hidden by you", "bg-paper text-muted"];
  return (
    <span className={`rounded-full px-2.5 py-[3px] text-[11px] font-semibold ${cls}`}>
      {label}
    </span>
  );
}

function ListingForm({
  shop,
  onSaved,
  onCancel,
}: {
  shop: Shop | null;
  onSaved: (shop: Shop) => void;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState<Required<ShopInput>>({
    name: shop?.name ?? "",
    description: shop?.description ?? "",
    phone: shop?.phone ?? "",
    email: shop?.email ?? "",
    address: shop?.address ?? "",
    openingTime: hhmm(shop?.openingTime) ?? "",
    closingTime: hhmm(shop?.closingTime) ?? "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (patch: Partial<ShopInput>) => setForm({ ...form, ...patch });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    // Blank means "not supplied"; the backend keeps what it has on edit.
    const payload: ShopInput = Object.fromEntries(
      Object.entries(form)
        .map(([k, v]) => [k, v.trim()])
        .filter(([, v]) => v !== ""),
    ) as unknown as ShopInput;
    try {
      const saved = shop
        ? await api.put<Shop>(SHOP_ENDPOINTS.shop(shop.id), payload)
        : await api.post<Shop>(SHOP_ENDPOINTS.create, payload);
      onSaved(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the listing.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="mt-4">
      {error && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-accent bg-accent-soft px-3.5 py-2.5 text-[13px] text-accent"
        >
          {error}
        </p>
      )}
      <Field id="shopName" label="Business name" value={form.name} onChange={(v) => set({ name: v })} required />
      <Field
        id="shopDescription"
        label="What you offer (optional)"
        value={form.description}
        onChange={(v) => set({ description: v })}
      />
      <div className="grid grid-cols-2 gap-3">
        <Field id="shopOpen" label="Opens" type="time" value={form.openingTime} onChange={(v) => set({ openingTime: v })} />
        <Field id="shopClose" label="Closes" type="time" value={form.closingTime} onChange={(v) => set({ closingTime: v })} />
      </div>
      <Field id="shopPhone" label="Phone" type="tel" placeholder="082 123 4567" value={form.phone} onChange={(v) => set({ phone: v })} />
      <Field id="shopEmail" label="Email (optional)" type="email" value={form.email} onChange={(v) => set({ email: v })} />
      <Field
        id="shopAddress"
        label="Where to find you"
        placeholder="Next to the clinic, Main Road"
        value={form.address}
        onChange={(v) => set({ address: v })}
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="cursor-pointer rounded-lg bg-accent px-4 py-2.5 text-[13px] font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Saving…" : shop ? "Save changes" : "Submit listing"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer rounded-lg border border-line px-4 py-2.5 text-[13px] font-semibold text-ink transition hover:border-ink"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  ...input
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "id" | "value" | "onChange">) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-[10px] border border-line bg-paper px-4 py-3 text-[14px] outline-none transition focus:border-accent focus:outline-2 focus:outline-accent"
        {...input}
      />
    </div>
  );
}
