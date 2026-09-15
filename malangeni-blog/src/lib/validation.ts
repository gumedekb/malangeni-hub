/**
 * Format checks shared by forms. The backend enforces the same rules — these
 * only give instant feedback.
 */

/** 0 or +27, a 6/7/8 network prefix, then 8 digits — mirrors ValidationUtil.requireSaCellphone. */
const SA_CELL = /^(0|\+27)[6-8]\d{8}$/;

export const SA_CELL_MESSAGE =
  "Enter a South African cellphone number: 10 digits starting with 0 (e.g. 0821234567) or +27 (e.g. +27821234567).";

/** The number with spaces, dashes and brackets removed, or null if it isn't a valid SA cellphone. */
export function normalizeSaCell(input: string): string | null {
  const stripped = input.replace(/[\s()-]/g, "");
  return SA_CELL.test(stripped) ? stripped : null;
}
