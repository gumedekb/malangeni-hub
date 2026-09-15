"use client";

import { useState } from "react";
import { api, ApiError, COMMUNITY_ENDPOINTS } from "@/lib/api";
import type { ApiGroup } from "@/lib/types";
import { ErrorLine, INPUT_CLASS, Label, PRIMARY_BUTTON, SECONDARY_BUTTON } from "./ui";

/**
 * Create or edit a community group. Hub team only — the backend rejects
 * anyone else, and the UI only renders this for admins and moderators.
 */
export function GroupForm({
  group,
  onSaved,
  onCancel,
}: {
  /** Omit to create a new group. */
  group?: ApiGroup;
  onSaved: (group: ApiGroup) => void;
  onCancel?: () => void;
}) {
  const [name, setName] = useState(group?.name ?? "");
  const [icon, setIcon] = useState(group?.icon ?? "");
  const [description, setDescription] = useState(group?.description ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const idPrefix = group ? `group-${group.id}` : "group-new";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const payload = {
      name: name.trim(),
      icon: icon.trim() || undefined,
      description: description.trim() || undefined,
    };
    try {
      const saved = group
        ? await api.put<ApiGroup>(COMMUNITY_ENDPOINTS.group(group.id), payload)
        : await api.post<ApiGroup>(COMMUNITY_ENDPOINTS.groups, payload);
      if (!group) {
        setName("");
        setIcon("");
        setDescription("");
      }
      onSaved(saved);
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 409
          ? "A group with that name already exists."
          : err instanceof Error
            ? err.message
            : "Could not save the group.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)}>
      {error && <ErrorLine>{error}</ErrorLine>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_120px]">
        <div>
          <Label htmlFor={`${idPrefix}-name`}>Name</Label>
          <input
            id={`${idPrefix}-name`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Gardening"
            maxLength={255}
            required
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <Label htmlFor={`${idPrefix}-icon`}>Icon (emoji)</Label>
          <input
            id={`${idPrefix}-icon`}
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="🌱"
            maxLength={8}
            className={INPUT_CLASS}
          />
        </div>
      </div>
      <div className="mt-4">
        <Label htmlFor={`${idPrefix}-description`}>Description (optional)</Label>
        <textarea
          id={`${idPrefix}-description`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Swap seeds, share tips and plan the community garden."
          className={INPUT_CLASS}
        />
      </div>
      <div className="mt-4 flex gap-2">
        <button type="submit" disabled={submitting} className={PRIMARY_BUTTON}>
          {submitting ? "Saving…" : group ? "Save changes" : "Create group"}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className={SECONDARY_BUTTON}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
