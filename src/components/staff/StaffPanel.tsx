"use client";

import { useState } from "react";
import { api, STAFF_ENDPOINTS } from "@/lib/api";
import { useAuth } from "@/lib/auth/AuthContext";
import { RequireAuth } from "@/components/auth/RequireAuth";
import {
  isAdmin,
  type BadgeRequest,
  type BadgeRequestStatus,
  type StaffUser,
} from "@/lib/auth/types";
import { hoursLabel } from "@/lib/shops";
import type { Shop } from "@/lib/types";
import { EventsAdmin } from "./EventsAdmin";
import { GroupsAdmin } from "./GroupsAdmin";
import { LibraryAdmin } from "./LibraryAdmin";
import { PlacesAdmin } from "./PlacesAdmin";
import { ServicesAdmin } from "./ServicesAdmin";
import {
  ErrorLine,
  Fact,
  formatDate,
  INPUT_CLASS,
  MemberLink,
  Note,
  Pager,
  PRIMARY_BUTTON,
  SECONDARY_BUTTON,
  TabButton,
  Table,
  usePage,
} from "./ui";

type Tab = "requests" | "log" | "listings" | "groups" | "events" | "services" | "places" | "library" | "team";

/**
 * Hub-team tools:
 *   - Business verification — unverified / verified / rejected / revoked, with
 *     verify, reject and revoke.
 *   - Verification log — every decision and who made it.
 *   - Directory listings — approve or hide business listings.
 *   - Groups and Events — create and delete.
 *   - Library — edit the library's details shown on /services.
 *   - Team (admins only) — make moderators, or revoke staff and business badges
 *     (never an admin's).
 * Hiding this page is a convenience; the backend enforces every role itself.
 */
export function StaffPanel() {
  return (
    <RequireAuth role="staff">
      <StaffTabs />
    </RequireAuth>
  );
}

function StaffTabs() {
  const { profile } = useAuth();
  // `/staff#groups`, `#places` and `#library` (linked from other pages) open straight on that tab.
  const [tab, setTab] = useState<Tab>(() => {
    const hash = typeof window !== "undefined" ? window.location.hash.slice(1) : "";
    return hash === "groups" || hash === "places" || hash === "library" ? hash : "requests";
  });

  const tabs: [Tab, string][] = [
    ["requests", "Business verification"],
    ["log", "Verification log"],
    ["listings", "Directory listings"],
    ["groups", "Groups"],
    ["events", "Events"],
    ["services", "Services"],
    ["places", "Places"],
    ["library", "Library"],
  ];
  if (isAdmin(profile)) tabs.push(["team", "Team"]);

  return (
    <div className="pb-16">
      <div className="mb-5 flex flex-wrap gap-2">
        {tabs.map(([key, label]) => (
          <TabButton key={key} active={tab === key} onClick={() => setTab(key)}>
            {label}
          </TabButton>
        ))}
      </div>
      {tab === "requests" && <RequestQueue />}
      {tab === "log" && <VerificationLog />}
      {tab === "listings" && <ListingsReview />}
      {tab === "groups" && <GroupsAdmin />}
      {tab === "events" && <EventsAdmin />}
      {tab === "services" && <ServicesAdmin />}
      {tab === "places" && <PlacesAdmin />}
      {tab === "library" && <LibraryAdmin />}
      {tab === "team" && isAdmin(profile) && <TeamList />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Business verification
// ---------------------------------------------------------------------------

const STATUS_LABELS: Record<BadgeRequestStatus, string> = {
  PENDING: "Unverified",
  APPROVED: "Verified",
  REJECTED: "Rejected",
  REVOKED: "Revoked",
};

function RequestQueue() {
  const [status, setStatus] = useState<BadgeRequestStatus>("PENDING");
  const [pageNo, setPageNo] = useState(0);
  const [reload, setReload] = useState(0);
  const { page, error } = usePage<BadgeRequest>(
    STAFF_ENDPOINTS.badgeRequests(status, pageNo),
    reload,
  );

  function show(next: BadgeRequestStatus) {
    setPageNo(0);
    setStatus(next);
  }

  return (
    <section>
      <div className="mb-4 flex flex-wrap gap-2">
        {(Object.keys(STATUS_LABELS) as BadgeRequestStatus[]).map((s) => (
          <TabButton key={s} active={status === s} onClick={() => show(s)} small>
            {STATUS_LABELS[s]}
          </TabButton>
        ))}
      </div>

      {error ? (
        <Note>{error}</Note>
      ) : !page ? (
        <Note>Loading…</Note>
      ) : page.content.length === 0 ? (
        <Note>
          {status === "PENDING"
            ? "No businesses waiting for verification."
            : "Nothing here yet."}
        </Note>
      ) : (
        <div className="flex flex-col gap-4">
          {page.content.map((r) => (
            <RequestCard key={r.id} request={r} onChanged={() => setReload((n) => n + 1)} />
          ))}
          <Pager page={page} onPage={setPageNo} />
        </div>
      )}
    </section>
  );
}

function RequestCard({
  request,
  onChanged,
}: {
  request: BadgeRequest;
  onChanged: () => void;
}) {
  const { profile } = useAuth();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwn = profile && String(profile.id) === String(request.userId);

  async function act(url: string) {
    setError(null);
    setBusy(true);
    try {
      const body = note.trim() ? { note: note.trim() } : undefined;
      await api.post(url, body);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the decision.");
      setBusy(false);
    }
  }

  return (
    <article className="rounded-card border border-line bg-card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-serif text-[18px] font-semibold">{request.businessName}</h3>
        <span className="rounded-full bg-paper px-2.5 py-[3px] text-[11px] font-semibold uppercase tracking-[0.5px] text-muted">
          {businessTypeLabel(request)}
        </span>
      </div>

      <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-[13.5px] sm:grid-cols-2">
        <Fact label="Requested by">
          <MemberLink user={request.user} />
        </Fact>
        <Fact label="Requested on">{formatDate(request.createdAt)}</Fact>
        <Fact label="Category">{request.category || "—"}</Fact>
        <Fact label="Location">{request.location || "—"}</Fact>
        <Fact label="Contact number">
          {request.contactNumber ? (
            <a href={`tel:${request.contactNumber}`} className="text-accent">
              {request.contactNumber}
            </a>
          ) : (
            "—"
          )}
        </Fact>
        {request.registrationNumber && (
          <Fact label="Registration number">{request.registrationNumber}</Fact>
        )}
      </dl>
      {request.description && (
        <p className="mt-3 text-[13.5px] text-muted">{request.description}</p>
      )}

      {request.status !== "PENDING" && <DecisionTrail request={request} />}

      {(request.status === "PENDING" || request.status === "APPROVED") &&
        (isOwn ? (
          <p className="mt-4 text-[13px] text-muted">
            This is your own business — another team member has to handle it.
          </p>
        ) : (
          <div className="mt-4 border-t border-line pt-4">
            {error && <ErrorLine>{error}</ErrorLine>}
            <label htmlFor={`note-${request.id}`} className="mb-1.5 block text-[13px] font-medium">
              {request.status === "PENDING"
                ? "How did you confirm it? / reason (optional)"
                : "Why is the badge being revoked? (optional)"}
            </label>
            <textarea
              id={`note-${request.id}`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              maxLength={1000}
              placeholder={
                request.status === "PENDING"
                  ? "Called the number, visited the shop… or why it can't be confirmed"
                  : "Business has closed, details were false…"
              }
              className={INPUT_CLASS}
            />
            <p className="mt-1 text-[12px] text-muted">
              Saved in the verification log and shown to the member.
            </p>
            <div className="mt-3 flex gap-2">
              {request.status === "PENDING" ? (
                <>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void act(STAFF_ENDPOINTS.approve(request.id))}
                    className={PRIMARY_BUTTON}
                  >
                    Verify
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void act(STAFF_ENDPOINTS.reject(request.id))}
                    className={SECONDARY_BUTTON}
                  >
                    Reject
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    if (window.confirm(`Revoke the business badge for ${request.businessName}? Their directory listing will be taken down.`)) {
                      void act(STAFF_ENDPOINTS.revokeBusiness(request.userId));
                    }
                  }}
                  className={SECONDARY_BUTTON}
                >
                  Revoke business badge
                </button>
              )}
            </div>
          </div>
        ))}
    </article>
  );
}

/** "Verified by X on … — note", then "Revoked by Y on … — note" when relevant. */
function DecisionTrail({ request }: { request: BadgeRequest }) {
  const decided = request.status === "REJECTED" ? "Rejected" : "Verified";
  return (
    <div className="mt-4 flex flex-col gap-1 border-t border-line pt-3 text-[13px] text-muted">
      <p>
        {decided}
        {request.reviewedBy && (
          <>
            {" by "}
            <MemberLink user={request.reviewedBy} />
          </>
        )}
        {request.reviewedAt ? ` on ${formatDate(request.reviewedAt)}` : ""}
        {request.reviewNote ? ` — “${request.reviewNote}”` : ""}
      </p>
      {request.status === "REVOKED" && (
        <p>
          Revoked
          {request.revokedBy && (
            <>
              {" by "}
              <MemberLink user={request.revokedBy} />
            </>
          )}
          {request.revokedAt ? ` on ${formatDate(request.revokedAt)}` : ""}
          {request.revokeNote ? ` — “${request.revokeNote}”` : ""}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Verification log
// ---------------------------------------------------------------------------

const DECISION_STYLES: Record<Exclude<BadgeRequestStatus, "PENDING">, [string, string]> = {
  APPROVED: ["Verified", "bg-fun-soft text-fun"],
  REJECTED: ["Rejected", "bg-accent-soft text-accent"],
  REVOKED: ["Revoked", "bg-paper text-muted"],
};

function VerificationLog() {
  const [pageNo, setPageNo] = useState(0);
  const { page, error } = usePage<BadgeRequest>(STAFF_ENDPOINTS.badgeLog(pageNo), 0);

  if (error) return <Note>{error}</Note>;
  if (!page) return <Note>Loading…</Note>;
  if (page.content.length === 0) return <Note>No businesses have been verified or rejected yet.</Note>;

  return (
    <section>
      <p className="mb-4 text-[13px] text-muted">
        Every decision on a business, newest first — who was verified, and by whom.
      </p>
      <Table head={["When", "Business", "Member", "Decision", "By", "Note"]} minWidth={760}>
        {page.content.map((r) => {
          const [label, cls] = DECISION_STYLES[r.status as Exclude<BadgeRequestStatus, "PENDING">];
          const revoked = r.status === "REVOKED";
          return (
            <tr key={r.id} className="border-b border-line align-top last:border-0">
              <td className="whitespace-nowrap px-4 py-3 text-muted">
                {formatDate(revoked ? r.revokedAt : r.reviewedAt)}
              </td>
              <td className="px-4 py-3">
                <div className="font-semibold">{r.businessName}</div>
                <div className="text-[12px] text-muted">{businessTypeLabel(r)}</div>
              </td>
              <td className="px-4 py-3">
                <MemberLink user={r.user} />
              </td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2.5 py-[3px] text-[11px] font-semibold ${cls}`}>
                  {label}
                </span>
              </td>
              <td className="px-4 py-3">
                {revoked ? (
                  <>
                    <MemberLink user={r.revokedBy} />
                    <div className="text-[12px] text-muted">
                      verified by {r.reviewedBy?.username ?? "—"}
                    </div>
                  </>
                ) : (
                  <MemberLink user={r.reviewedBy} />
                )}
              </td>
              <td className="px-4 py-3 text-muted">
                {(revoked ? r.revokeNote : r.reviewNote) || "—"}
              </td>
            </tr>
          );
        })}
      </Table>
      <Pager page={page} onPage={setPageNo} />
    </section>
  );
}

// ---------------------------------------------------------------------------
// Directory listings
// ---------------------------------------------------------------------------

function ListingsReview() {
  const [approved, setApproved] = useState(false);
  const [pageNo, setPageNo] = useState(0);
  const [reload, setReload] = useState(0);
  const { page, error } = usePage<Shop>(STAFF_ENDPOINTS.shops(approved, pageNo), reload);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function setApproval(shop: Shop, next: boolean) {
    setActionError(null);
    setBusy(shop.id);
    try {
      await api.put(STAFF_ENDPOINTS.approveShop(shop.id, next));
      setReload((n) => n + 1);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not update the listing.");
    } finally {
      setBusy(null);
    }
  }

  function show(next: boolean) {
    setPageNo(0);
    setApproved(next);
  }

  return (
    <section>
      <div className="mb-4 flex flex-wrap gap-2">
        <TabButton small active={!approved} onClick={() => show(false)}>
          Waiting for approval
        </TabButton>
        <TabButton small active={approved} onClick={() => show(true)}>
          Approved
        </TabButton>
      </div>
      {actionError && <ErrorLine>{actionError}</ErrorLine>}

      {error ? (
        <Note>{error}</Note>
      ) : !page ? (
        <Note>Loading…</Note>
      ) : page.content.length === 0 ? (
        <Note>{approved ? "No approved listings yet." : "No listings waiting for approval."}</Note>
      ) : (
        <>
          <Table head={["Business", "Owner", "Hours", "Contact", "Where", ""]} minWidth={760}>
            {page.content.map((s) => (
              <tr key={s.id} className="border-b border-line align-top last:border-0">
                <td className="px-4 py-3">
                  <div className="font-semibold">{s.name}</div>
                  {!s.active && <div className="text-[12px] text-muted">Hidden by owner</div>}
                </td>
                <td className="px-4 py-3">
                  <MemberLink user={s.owner} />
                </td>
                <td className="px-4 py-3 text-muted">{hoursLabel(s)}</td>
                <td className="px-4 py-3">
                  {s.phone || "—"}
                  {s.email && <div className="text-[12px] text-muted">{s.email}</div>}
                </td>
                <td className="px-4 py-3 text-muted">{s.address || "—"}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    disabled={busy === s.id}
                    onClick={() => void setApproval(s, !approved)}
                    className={approved ? SECONDARY_BUTTON : PRIMARY_BUTTON}
                  >
                    {approved ? "Hide" : "Approve"}
                  </button>
                </td>
              </tr>
            ))}
          </Table>
          <Pager page={page} onPage={setPageNo} />
        </>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Team (admins only)
// ---------------------------------------------------------------------------

function TeamList() {
  const [pageNo, setPageNo] = useState(0);
  const [reload, setReload] = useState(0);
  const { page, error } = usePage<StaffUser>(STAFF_ENDPOINTS.users(pageNo), reload);

  if (error) return <Note>{error}</Note>;
  if (!page) return <Note>Loading…</Note>;

  return (
    <section>
      <p className="mb-4 text-[13px] text-muted">
        Admins are set in the backend configuration — their badges can&apos;t be
        changed here. Moderators carry the Hub team badge: they can verify
        businesses, approve listings, ban posters and manage content.
      </p>
      <Table head={["Member", "Role", "Joined", ""]} minWidth={640}>
        {page.content.map((u) => (
          <TeamRow key={u.id} user={u} onChanged={() => setReload((n) => n + 1)} />
        ))}
      </Table>
      <Pager page={page} onPage={setPageNo} />
    </section>
  );
}

function TeamRow({ user, onChanged }: { user: StaffUser; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<unknown>) {
    setError(null);
    setBusy(true);
    try {
      await action();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not make that change.");
    } finally {
      setBusy(false);
    }
  }

  const setRole = (role: "MODERATOR" | "USER" | "BUSINESS_OWNER") =>
    run(() => api.put(STAFF_ENDPOINTS.role(user.id), { role }));

  function revokeStaff() {
    if (!window.confirm(`Revoke ${user.username}'s staff badge? They will no longer be a moderator.`)) return;
    // Back to business owner if their business is confirmed.
    void setRole(user.badge === "BUSINESS" ? "BUSINESS_OWNER" : "USER");
  }

  function revokeBusiness() {
    if (!window.confirm(`Revoke ${user.username}'s business badge? Their directory listing will be taken down.`)) return;
    void run(() => api.post(STAFF_ENDPOINTS.revokeBusiness(user.id)));
  }

  const isAdminRow = user.role === "ADMIN";

  return (
    <tr className="border-b border-line last:border-0">
      <td className="px-4 py-3">
        <div className="font-semibold">{user.username}</div>
        <div className="text-[12px] text-muted">{user.email}</div>
        {error && <div className="mt-1 text-[12px] text-accent">{error}</div>}
      </td>
      <td className="px-4 py-3">
        {roleLabel(user.role)}
        {user.backstage && <span className="text-muted"> · backstage</span>}
        {user.badge === "BUSINESS" && <span className="text-muted"> · business</span>}
      </td>
      <td className="px-4 py-3 text-muted">{formatDate(user.createdAt)}</td>
      <td className="px-4 py-3">
        {isAdminRow ? (
          <div className="text-right text-[12px] text-muted">Set in config</div>
        ) : (
          <div className="flex flex-wrap justify-end gap-2">
            {user.role === "MODERATOR" ? (
              <button type="button" disabled={busy} onClick={revokeStaff} className={SECONDARY_BUTTON}>
                Revoke staff badge
              </button>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => void setRole("MODERATOR")}
                className="cursor-pointer rounded-lg bg-accent px-3 py-1.5 text-[12.5px] font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
              >
                Make moderator
              </button>
            )}
            {user.badge === "BUSINESS" && (
              <button type="button" disabled={busy} onClick={revokeBusiness} className={SECONDARY_BUTTON}>
                Revoke business badge
              </button>
            )}
          </div>
        )}
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Bits
// ---------------------------------------------------------------------------

function businessTypeLabel(r: BadgeRequest) {
  return r.businessType === "FORMAL"
    ? "Formal"
    : r.businessType === "INFORMAL"
      ? "Informal"
      : "Type not given";
}

function roleLabel(role: StaffUser["role"]) {
  switch (role) {
    case "ADMIN":
      return "Admin";
    case "MODERATOR":
      return "Moderator";
    case "BUSINESS_OWNER":
      return "Business owner";
    default:
      return "Member";
  }
}
