"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { api, ApiError, COMMUNITY_ENDPOINTS } from "@/lib/api";
import type { ApiGroup } from "@/lib/types";
import { GroupForm } from "./GroupForm";
import { ErrorLine, FormCard, Note, SECONDARY_BUTTON, Table, useFetch } from "./ui";

/** Hub team: create, edit and delete community groups. */
export function GroupsAdmin() {
  const [reload, setReload] = useState(0);
  const { data: groups, error } = useFetch<ApiGroup[]>(COMMUNITY_ENDPOINTS.groups, reload);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function remove(group: ApiGroup) {
    if (!window.confirm(`Delete the group “${group.name}”? Members will be removed from it.`)) return;
    setActionError(null);
    setBusy(group.id);
    try {
      await api.del(COMMUNITY_ENDPOINTS.group(group.id));
      setReload((n) => n + 1);
    } catch (err) {
      setActionError(
        err instanceof ApiError && err.status === 409
          ? `“${group.name}” still has posts, so it can't be deleted.`
          : err instanceof Error
            ? err.message
            : "Could not delete the group.",
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <section>
      <FormCard title="Create a group">
        <GroupForm onSaved={() => setReload((n) => n + 1)} />
      </FormCard>

      <h3 className="mb-3 font-serif text-[18px] font-semibold">Groups</h3>
      {actionError && <ErrorLine>{actionError}</ErrorLine>}
      {error ? (
        <Note>{error}</Note>
      ) : !groups ? (
        <Note>Loading…</Note>
      ) : groups.length === 0 ? (
        <Note>No groups yet — the community page shows preview groups until you create one.</Note>
      ) : (
        <Table head={["Group", "Members", "Description", ""]} minWidth={640}>
          {groups.map((g) => (
            <Fragment key={g.id}>
              <tr className="border-b border-line align-top last:border-0">
                <td className="px-4 py-3">
                  <Link
                    href={`/community/groups/${encodeURIComponent(g.id)}`}
                    className="font-semibold hover:underline"
                  >
                    <span className="mr-1.5">{g.icon || "👥"}</span>
                    {g.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted">{g.memberCount ?? 0}</td>
                <td className="px-4 py-3 text-muted">{g.description || "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(editingId === g.id ? null : g.id)}
                      className={SECONDARY_BUTTON}
                    >
                      {editingId === g.id ? "Close" : "Edit"}
                    </button>
                    <button
                      type="button"
                      disabled={busy === g.id}
                      onClick={() => void remove(g)}
                      className={SECONDARY_BUTTON}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
              {editingId === g.id && (
                <tr className="border-b border-line bg-paper last:border-0">
                  <td colSpan={4} className="px-4 py-4">
                    <GroupForm
                      group={g}
                      onSaved={() => {
                        setEditingId(null);
                        setReload((n) => n + 1);
                      }}
                      onCancel={() => setEditingId(null)}
                    />
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </Table>
      )}
    </section>
  );
}
