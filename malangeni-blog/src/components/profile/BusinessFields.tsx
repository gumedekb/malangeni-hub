"use client";

import {
  BUSINESS_CATEGORIES,
  type BadgeRequestInput,
  type BusinessType,
} from "@/lib/auth/types";

/**
 * The business questions, shared by first-sign-in onboarding and the
 * "Request business badge" form so the two can never drift apart.
 */

export function emptyBusiness(type: BusinessType): BadgeRequestInput {
  return {
    businessType: type,
    businessName: "",
    category: BUSINESS_CATEGORIES[0],
    location: "",
    contactNumber: "",
    registrationNumber: "",
    description: "",
  };
}

/** Trimmed request body. Only a formal business sends a registration number. */
export function businessPayload(input: BadgeRequestInput): BadgeRequestInput {
  return {
    businessType: input.businessType,
    businessName: input.businessName.trim(),
    category: input.category,
    location: input.location.trim(),
    contactNumber: input.contactNumber.trim(),
    registrationNumber:
      input.businessType === "FORMAL"
        ? input.registrationNumber?.trim() || undefined
        : undefined,
    description: input.description?.trim() || undefined,
  };
}

export function BusinessFields({
  value,
  onChange,
  typeSelectable,
}: {
  value: BadgeRequestInput;
  onChange: (value: BadgeRequestInput) => void;
  /** Off during onboarding, where the member has already picked the type. */
  typeSelectable: boolean;
}) {
  const set = (patch: Partial<BadgeRequestInput>) =>
    onChange({ ...value, ...patch });

  return (
    <>
      {typeSelectable && (
        <div className="mb-4">
          <label
            htmlFor="businessType"
            className="mb-1.5 block text-[13px] font-medium"
          >
            Is the business registered?
          </label>
          <select
            id="businessType"
            value={value.businessType ?? "INFORMAL"}
            onChange={(e) =>
              set({ businessType: e.target.value as BusinessType })
            }
            className={SELECT_CLASS}
          >
            <option value="INFORMAL">
              Informal — not registered (spaza, salon, stall…)
            </option>
            <option value="FORMAL">Formal — registered (e.g. with CIPC)</option>
          </select>
        </div>
      )}

      <Field
        id="businessName"
        label="Business name"
        placeholder="Nomsa's Hair Studio"
        value={value.businessName}
        onChange={(v) => set({ businessName: v })}
        required
      />

      <div className="mb-4">
        <label htmlFor="category" className="mb-1.5 block text-[13px] font-medium">
          What kind of business?
        </label>
        <select
          id="category"
          value={value.category}
          onChange={(e) => set({ category: e.target.value })}
          className={SELECT_CLASS}
        >
          {BUSINESS_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <Field
        id="location"
        label="Where do you trade?"
        placeholder="Next to the clinic, Main Road"
        value={value.location}
        onChange={(v) => set({ location: v })}
        required
      />

      <Field
        id="contactNumber"
        label="Business contact number"
        type="tel"
        placeholder="082 123 4567"
        value={value.contactNumber}
        onChange={(v) => set({ contactNumber: v })}
        hint="This is shown publicly so customers can reach you."
        required
      />

      {value.businessType === "FORMAL" && (
        <Field
          id="registrationNumber"
          label="Registration number (optional)"
          placeholder="2021/123456/07"
          value={value.registrationNumber ?? ""}
          onChange={(v) => set({ registrationNumber: v })}
          hint="Helps a moderator confirm it faster. Not required."
        />
      )}

      <Field
        id="description"
        label="What do you sell or offer? (optional)"
        placeholder="Braids, cuts and treatments"
        value={value.description ?? ""}
        onChange={(v) => set({ description: v })}
      />
    </>
  );
}

const SELECT_CLASS =
  "w-full cursor-pointer rounded-[10px] border border-line bg-paper px-4 py-3 text-[14px] outline-none transition focus:border-accent";

function Field({
  id,
  label,
  value,
  onChange,
  hint,
  ...input
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
} & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "id" | "value" | "onChange"
>) {
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
      {hint && <p className="mt-1 text-[12px] text-muted">{hint}</p>}
    </div>
  );
}
