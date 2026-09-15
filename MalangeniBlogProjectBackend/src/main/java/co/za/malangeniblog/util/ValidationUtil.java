package co.za.malangeniblog.util;

import co.za.malangeniblog.exception.BadRequestException;

import java.util.regex.Pattern;

public class ValidationUtil {

    private static final Pattern EMAIL_PATTERN = 
        Pattern.compile("^[A-Za-z0-9+_.-]+@(.+)$");
    
    private static final Pattern PHONE_PATTERN =
        Pattern.compile("^[+]?[0-9]{10,13}$");

    private static final Pattern SUBDOMAIN_PATTERN =
        Pattern.compile("^[a-z0-9]([a-z0-9-]{1,28}[a-z0-9])?$");

    private static final java.util.Set<String> RESERVED_SUBDOMAINS = java.util.Set.of(
        "www", "api", "admin", "app", "mail", "ftp", "static", "cdn", "assets",
        "root", "mysql", "localhost", "test", "malangeni", "malangenihub", "shop", "shops"
    );

    public static boolean isValidEmail(String email) {
        return email != null && EMAIL_PATTERN.matcher(email).matches();
    }

    public static boolean isValidSubdomain(String subdomain) {
        return subdomain != null
                && SUBDOMAIN_PATTERN.matcher(subdomain).matches()
                && !RESERVED_SUBDOMAINS.contains(subdomain);
    }

    /**
     * Spaces, dashes and brackets are stripped before matching — people type "082 123 4567"
     * and "(082) 123-4567", and rejecting those would look like a broken form rather than a
     * rule. Only the digits are validated; the value is stored as the user typed it.
     */
    public static boolean isValidPhone(String phone) {
        if (isBlank(phone)) {
            return false;
        }
        String digitsOnly = phone.replaceAll("[\\s()\\-]", "");
        return PHONE_PATTERN.matcher(digitsOnly).matches();
    }

    /**
     * Only absolute http(s) URLs with a host. The previous {@code new URL(url)} check accepted
     * anything with a protocol Java recognises — {@code file:///etc/passwd} and {@code jar:...}
     * passed. That matters because these values are rendered as image sources and clickable
     * links (notably {@code Sponsor.targetUrl}), so the scheme has to be pinned down here.
     */
    public static boolean isValidUrl(String url) {
        if (isBlank(url)) {
            return false;
        }
        try {
            java.net.URI uri = new java.net.URI(url.trim());
            String scheme = uri.getScheme();
            return uri.isAbsolute()
                    && uri.getHost() != null
                    && ("http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme));
        } catch (java.net.URISyntaxException e) {
            return false;
        }
    }

    public static boolean isValidLatitude(String latitude) {
        return isNumberInRange(latitude, -90, 90);
    }

    public static boolean isValidLongitude(String longitude) {
        return isNumberInRange(longitude, -180, 180);
    }

    public static boolean isValidCoordinate(String latitude, String longitude) {
        return isValidLatitude(latitude) && isValidLongitude(longitude);
    }

    /**
     * Coordinates are optional, but a half-set pair is useless for placing a pin on a map,
     * so either both are supplied or neither. Callers pass the values the record will end up
     * with (for updates: the incoming value if present, otherwise the stored one).
     */
    public static void validateCoordinates(String latitude, String longitude) {
        boolean hasLatitude = latitude != null && !latitude.trim().isEmpty();
        boolean hasLongitude = longitude != null && !longitude.trim().isEmpty();
        if (!hasLatitude && !hasLongitude) {
            return;
        }
        if (hasLatitude != hasLongitude) {
            throw new BadRequestException("Latitude and longitude must be provided together");
        }
        if (!isValidLatitude(latitude)) {
            throw new BadRequestException("Latitude must be a number between -90 and 90");
        }
        if (!isValidLongitude(longitude)) {
            throw new BadRequestException("Longitude must be a number between -180 and 180");
        }
    }

    private static boolean isNumberInRange(String value, double min, double max) {
        if (value == null) {
            return false;
        }
        try {
            double parsed = Double.parseDouble(value.trim());
            return parsed >= min && parsed <= max;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    public static boolean hasMinLength(String value, int minLength) {
        return value != null && value.length() >= minLength;
    }

    public static boolean hasMaxLength(String value, int maxLength) {
        return value == null || value.length() <= maxLength;
    }

    // ---------------------------------------------------------------------
    // Throwing wrappers used by the services on write paths.
    //
    // All of these treat blank/absent as "not supplied, nothing to check" — these fields are
    // optional, and the partial-update pattern (`if (!isNullOrEmpty(x)) existing.setX(x)`)
    // relies on being able to omit them. Required-ness is enforced separately by
    // RepositoryValidationHelper.validateNotEmpty.
    // ---------------------------------------------------------------------

    /** Columns declared without an explicit length default to VARCHAR(255). */
    public static final int MAX_SHORT_TEXT = 255;

    /** Cap for TEXT columns, so a runaway paste fails as a 400 rather than filling the table. */
    public static final int MAX_LONG_TEXT = 20_000;

    public static void validateOptionalEmail(String email, String fieldName) {
        if (!isBlank(email) && !isValidEmail(email)) {
            throw new BadRequestException(fieldName + " is not a valid email address");
        }
    }

    public static void validateOptionalPhone(String phone, String fieldName) {
        if (!isBlank(phone) && !isValidPhone(phone)) {
            throw new BadRequestException(
                    fieldName + " must be 10-13 digits, optionally starting with '+' (e.g. +27821234567)");
        }
    }

    /**
     * South African cellphone: 0 or +27, then a 6/7/8 network prefix and 8 more digits
     * (0821234567, +27821234567). Stricter than {@link #PHONE_PATTERN} on purpose: this number is
     * published so people can call, and "0000000000" satisfies "10 digits" but reaches nobody.
     */
    private static final Pattern SA_CELLPHONE_PATTERN = Pattern.compile("^(0|\\+27)[6-8][0-9]{8}$");

    public static final String SA_CELLPHONE_MESSAGE =
            "must be a South African cellphone number: 10 digits starting with 0 (e.g. 0821234567) "
                    + "or +27 (e.g. +27821234567)";

    /**
     * Required SA cellphone. Spaces, dashes and brackets are stripped first ("082 123 4567" is
     * fine); the stripped form is returned so every stored number looks the same.
     */
    public static String requireSaCellphone(String phone, String fieldName) {
        String stripped = phone == null ? "" : phone.replaceAll("[\\s()\\-]", "");
        if (!SA_CELLPHONE_PATTERN.matcher(stripped).matches()) {
            throw new BadRequestException(fieldName + " " + SA_CELLPHONE_MESSAGE);
        }
        return stripped;
    }

    public static void validateOptionalUrl(String url, String fieldName) {
        if (!isBlank(url) && !isValidUrl(url)) {
            throw new BadRequestException(fieldName + " must be a valid http(s) URL");
        }
    }

    public static void validateMaxLength(String value, int maxLength, String fieldName) {
        if (!hasMaxLength(value, maxLength)) {
            throw new BadRequestException(fieldName + " must be at most " + maxLength + " characters");
        }
    }

    private static boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
