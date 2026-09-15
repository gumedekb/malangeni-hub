package co.za.malangeniblog.util;

import java.util.Optional;

public class RepositoryValidationHelper {

    public static boolean isNullOrEmpty(String value) {
        return value == null || value.trim().isEmpty();
    }

    public static boolean isValid(String value) {
        return value != null && !value.trim().isEmpty();
    }

    public static <T> boolean isNullOrEmpty(java.util.Collection<T> collection) {
        return collection == null || collection.isEmpty();
    }

    public static <T> Optional<T> requireNonNull(T value, String message) {
        if (value == null) {
            throw new IllegalArgumentException(message);
        }
        return Optional.of(value);
    }

    public static void validateNotEmpty(String value, String fieldName) {
        if (isNullOrEmpty(value)) {
            throw new IllegalArgumentException(fieldName + " cannot be null or empty");
        }
    }
}
