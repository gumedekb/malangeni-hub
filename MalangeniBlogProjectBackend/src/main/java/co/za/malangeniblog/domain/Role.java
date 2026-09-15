package co.za.malangeniblog.domain;

public enum Role {
    ADMIN,
    USER,
    MODERATOR,
    /** Granted by staff when a badge request is approved - never self-assigned. */
    BUSINESS_OWNER
}
