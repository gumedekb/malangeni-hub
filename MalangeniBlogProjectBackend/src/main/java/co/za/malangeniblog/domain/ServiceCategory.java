package co.za.malangeniblog.domain;

/**
 * What kind of service a member offers. A fixed list rather than free text so the directory can
 * be filtered; OTHER covers anything missing. Labels live in the frontend (lib/services.ts).
 */
public enum ServiceCategory {
    PLUMBING,
    ELECTRICAL,
    BUILDING,
    MECHANIC,
    TRANSPORT,
    TUTORING,
    HAIR_BEAUTY,
    CATERING,
    CLEANING,
    GARDENING,
    CHILDCARE,
    IT_REPAIRS,
    OTHER
}
