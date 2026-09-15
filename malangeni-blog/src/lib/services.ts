import type { ServiceCategory } from "./types";

/** Mirrors the backend's ServiceCategory enum. */
export const SERVICE_CATEGORIES: { value: ServiceCategory; label: string; icon: string }[] = [
  { value: "PLUMBING", label: "Plumbing", icon: "🔧" },
  { value: "ELECTRICAL", label: "Electrical", icon: "💡" },
  { value: "BUILDING", label: "Building & repairs", icon: "🧱" },
  { value: "MECHANIC", label: "Mechanic", icon: "🚗" },
  { value: "TRANSPORT", label: "Transport", icon: "🚐" },
  { value: "TUTORING", label: "Tutoring", icon: "📚" },
  { value: "HAIR_BEAUTY", label: "Hair & beauty", icon: "💇" },
  { value: "CATERING", label: "Catering & baking", icon: "🍲" },
  { value: "CLEANING", label: "Cleaning & laundry", icon: "🧺" },
  { value: "GARDENING", label: "Gardening", icon: "🌱" },
  { value: "CHILDCARE", label: "Childcare", icon: "🧸" },
  { value: "IT_REPAIRS", label: "Phones & computers", icon: "📱" },
  { value: "OTHER", label: "Other", icon: "🛠️" },
];

export function categoryInfo(value: ServiceCategory) {
  return SERVICE_CATEGORIES.find((c) => c.value === value) ?? SERVICE_CATEGORIES[SERVICE_CATEGORIES.length - 1];
}
