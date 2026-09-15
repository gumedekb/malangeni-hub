package co.za.malangeniblog.dto;

/**
 * What a Google Maps link says about a place. Times are "HH:mm"; a null pair means closed that day.
 * {@code hoursFound} is false when Google had no hours or the Places API key isn't set, and
 * {@code note} then says why, so the form can tell the hub team what to fill in by hand.
 */
public record MapsLookupResult(
        String name,
        String address,
        Double latitude,
        Double longitude,
        String mapsUrl,
        boolean hoursFound,
        String weekdayOpen,
        String weekdayClose,
        String saturdayOpen,
        String saturdayClose,
        String sundayOpen,
        String sundayClose,
        String note) {
}
