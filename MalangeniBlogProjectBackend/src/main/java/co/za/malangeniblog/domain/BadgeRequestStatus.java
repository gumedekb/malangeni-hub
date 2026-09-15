package co.za.malangeniblog.domain;

public enum BadgeRequestStatus {
    PENDING,
    APPROVED,
    REJECTED,
    /** Was approved, later taken away by staff (business closed, details turned out false...). */
    REVOKED
}
