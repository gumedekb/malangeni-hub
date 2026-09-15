package co.za.malangeniblog.domain;

/** Review states for member-submitted listings - the same flow as events and badge requests. */
public enum ApprovalStatus {
    /** Submitted (or edited) by a member; only they and the hub team can see it. */
    PENDING,
    /** Public. */
    APPROVED,
    /** Sent back to the member with a note about what to fix. */
    NEEDS_CHANGES
}
