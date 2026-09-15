package co.za.malangeniblog.domain;

/**
 * What the member said they are when they first signed in. A self-declaration only - choosing a
 * business type grants nothing until staff approve the matching badge request.
 */
public enum AccountType {
    MEMBER,
    BUSINESS_FORMAL,
    BUSINESS_INFORMAL;

    public boolean isBusiness() {
        return this != MEMBER;
    }

    public BusinessType toBusinessType() {
        return switch (this) {
            case BUSINESS_FORMAL -> BusinessType.FORMAL;
            case BUSINESS_INFORMAL -> BusinessType.INFORMAL;
            case MEMBER -> null;
        };
    }
}
