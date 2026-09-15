package co.za.malangeniblog.domain;

/** Mirrors the badge-request flow: members submit, the hub team approves or sends it back. */
public enum EventStatus {
    /** Submitted (or edited) by a member; only the organiser and the hub team can see it. */
    PENDING,
    /** Public. */
    APPROVED,
    /** Sent back to the organiser with a note - something a form can't check (e.g. add a picture). */
    NEEDS_CHANGES
}
