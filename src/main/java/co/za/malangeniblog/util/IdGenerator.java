package co.za.malangeniblog.util;

import java.util.UUID;

public class IdGenerator {

    public static String generateId() {
        return UUID.randomUUID().toString();
    }

    public static String generateId(String prefix) {
        return prefix + "_" + UUID.randomUUID().toString();
    }
}
