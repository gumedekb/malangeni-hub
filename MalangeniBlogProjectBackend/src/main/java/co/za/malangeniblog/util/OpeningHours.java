package co.za.malangeniblog.util;

import co.za.malangeniblog.exception.BadRequestException;

import java.time.LocalTime;

/** Opening-hours rules shared by the library and places on Explore. */
public final class OpeningHours {

    private OpeningHours() {
    }

    /** Both times or neither (closed that day), and opening before closing. */
    public static void validate(LocalTime open, LocalTime close, String day) {
        if ((open == null) != (close == null)) {
            throw new BadRequestException(day + ": give both opening and closing times, or neither if closed.");
        }
        if (open != null && !open.isBefore(close)) {
            throw new BadRequestException(day + ": opening time must be before closing time.");
        }
    }
}
