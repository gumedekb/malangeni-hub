package co.za.malangeniblog.service;

import co.za.malangeniblog.dto.MapsLookupResult;
import co.za.malangeniblog.exception.BadRequestException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URLDecoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Reads a Google Maps link pasted by the hub team. The place's name and pin come straight from the
 * link; its address and opening hours come from the Google Places API (New) when
 * GOOGLE_PLACES_API_KEY is set. Without the key the link still gives the pin and directions.
 */
@Service
public class GoogleMapsService {

    private static final Logger log = LoggerFactory.getLogger(GoogleMapsService.class);

    private static final String SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
    private static final String FIELDS =
            "places.displayName,places.formattedAddress,places.location,places.regularOpeningHours";
    private static final Duration TIMEOUT = Duration.ofSeconds(8);
    private static final int MAX_REDIRECTS = 5;

    private static final Pattern PLACE_NAME = Pattern.compile("/maps/place/([^/@?]+)");
    /** The place's own pin (!3d lat !4d lng) - more exact than the map's centre (@lat,lng). */
    private static final Pattern PIN = Pattern.compile("!3d(-?\\d+(?:\\.\\d+)?)!4d(-?\\d+(?:\\.\\d+)?)");
    private static final Pattern CENTRE = Pattern.compile("@(-?\\d+(?:\\.\\d+)?),(-?\\d+(?:\\.\\d+)?)");

    @Value("${google.places-api-key:}")
    private String apiKey;

    @Autowired
    private ObjectMapper objectMapper;

    /** Redirects are followed by hand so every hop can be checked against {@link #isGoogleMaps}. */
    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(TIMEOUT)
            .followRedirects(HttpClient.Redirect.NEVER)
            .build();

    public MapsLookupResult lookup(String link) {
        URI uri = parse(link);
        if (!isGoogleMaps(uri)) {
            throw new BadRequestException("That isn't a Google Maps link");
        }
        String url = expand(uri).toString();

        Draft draft = new Draft();
        draft.mapsUrl = url;
        draft.name = placeName(url);
        double[] pin = coordinates(url);
        if (pin != null) {
            draft.latitude = pin[0];
            draft.longitude = pin[1];
        }

        if (apiKey == null || apiKey.isBlank()) {
            draft.note = "The link gives the pin and directions. Opening hours fill in by themselves once "
                    + "GOOGLE_PLACES_API_KEY is set on the server - enter them by hand for now.";
            return draft.toResult();
        }
        if (draft.name == null && pin == null) {
            draft.note = "Couldn't find a place in that link. Open the place in Google Maps and copy its link.";
            return draft.toResult();
        }
        try {
            fillFromPlaces(draft);
        } catch (IOException | RuntimeException ex) {
            log.warn("Google Places lookup failed for {}", url, ex);
            draft.note = "Google didn't answer, so the opening hours weren't filled in. Enter them by hand.";
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            draft.note = "Google didn't answer, so the opening hours weren't filled in. Enter them by hand.";
        }
        return draft.toResult();
    }

    private static URI parse(String link) {
        if (link == null || link.isBlank()) {
            throw new BadRequestException("Paste a Google Maps link");
        }
        try {
            URI uri = new URI(link.trim());
            if (uri.getHost() == null) {
                throw new BadRequestException("That isn't a valid link");
            }
            return uri;
        } catch (URISyntaxException ex) {
            throw new BadRequestException("That isn't a valid link");
        }
    }

    /** Only Google Maps addresses are ever fetched - never an arbitrary URL from the request. */
    static boolean isGoogleMaps(URI uri) {
        String host = uri.getHost();
        if (host == null || !"https".equalsIgnoreCase(uri.getScheme())) {
            return false;
        }
        host = host.toLowerCase(Locale.ROOT);
        String path = uri.getRawPath() == null ? "" : uri.getRawPath();
        if (host.equals("maps.app.goo.gl")) {
            return true;
        }
        if (host.equals("goo.gl")) {
            return path.startsWith("/maps");
        }
        if (host.matches("(www\\.)?google\\.[a-z]{2,3}(\\.[a-z]{2})?")) {
            return path.startsWith("/maps");
        }
        return host.matches("maps\\.google\\.[a-z]{2,3}(\\.[a-z]{2})?");
    }

    private static boolean isShortLink(URI uri) {
        String host = uri.getHost() == null ? "" : uri.getHost().toLowerCase(Locale.ROOT);
        return host.equals("maps.app.goo.gl") || host.equals("goo.gl");
    }

    /** Share links (maps.app.goo.gl/...) redirect to the full address, which holds the name and pin. */
    private URI expand(URI uri) {
        URI current = uri;
        for (int hop = 0; hop < MAX_REDIRECTS && isShortLink(current); hop++) {
            try {
                HttpRequest request = HttpRequest.newBuilder(current)
                        .timeout(TIMEOUT)
                        .header("User-Agent", "Mozilla/5.0 (MalangeniHub)")
                        .GET()
                        .build();
                HttpResponse<Void> response = http.send(request, HttpResponse.BodyHandlers.discarding());
                String location = response.headers().firstValue("Location").orElse(null);
                if (response.statusCode() / 100 != 3 || location == null) {
                    break;
                }
                URI next = current.resolve(location);
                if (!isGoogleMaps(next)) {
                    break;
                }
                current = next;
            } catch (IOException | IllegalArgumentException ex) {
                log.warn("Couldn't expand Google Maps link {}", current, ex);
                break;
            } catch (InterruptedException ex) {
                Thread.currentThread().interrupt();
                break;
            }
        }
        return current;
    }

    private static String placeName(String url) {
        Matcher match = PLACE_NAME.matcher(url);
        if (!match.find()) {
            return null;
        }
        String raw = match.group(1);
        String name;
        try {
            name = URLDecoder.decode(raw, StandardCharsets.UTF_8);
        } catch (IllegalArgumentException ex) {
            name = raw.replace('+', ' ');
        }
        name = name.trim();
        return name.isEmpty() ? null : name;
    }

    private static double[] coordinates(String url) {
        for (Pattern pattern : new Pattern[]{PIN, CENTRE}) {
            Matcher match = pattern.matcher(url);
            if (match.find()) {
                double latitude = Double.parseDouble(match.group(1));
                double longitude = Double.parseDouble(match.group(2));
                if (Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180) {
                    return new double[]{latitude, longitude};
                }
            }
        }
        return null;
    }

    private void fillFromPlaces(Draft draft) throws IOException, InterruptedException {
        ObjectNode body = objectMapper.createObjectNode();
        body.put("textQuery", draft.name != null ? draft.name : draft.latitude + "," + draft.longitude);
        if (draft.latitude != null) {
            // Search around the link's pin, so a common name finds this place and not one elsewhere.
            ObjectNode circle = body.putObject("locationBias").putObject("circle");
            circle.putObject("center").put("latitude", draft.latitude).put("longitude", draft.longitude);
            circle.put("radius", 500.0);
        }
        HttpRequest request = HttpRequest.newBuilder(URI.create(SEARCH_URL))
                .timeout(TIMEOUT)
                .header("Content-Type", "application/json")
                .header("X-Goog-Api-Key", apiKey)
                .header("X-Goog-FieldMask", FIELDS)
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                .build();
        HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 200) {
            log.warn("Google Places returned {}: {}", response.statusCode(), response.body());
            draft.note = "Google Places refused the lookup (" + response.statusCode() + "). Check that "
                    + "GOOGLE_PLACES_API_KEY is right and the Places API (New) is enabled for it.";
            return;
        }

        JsonNode place = objectMapper.readTree(response.body()).path("places").path(0);
        if (place.isMissingNode() || place.isNull()) {
            draft.note = "Google couldn't find this place, so enter its opening hours by hand.";
            return;
        }
        String name = place.path("displayName").path("text").asText("");
        if (!name.isBlank()) {
            draft.name = name;
        }
        String address = place.path("formattedAddress").asText("");
        if (!address.isBlank()) {
            draft.address = address;
        }
        JsonNode location = place.path("location");
        if (location.has("latitude") && location.has("longitude")) {
            draft.latitude = location.get("latitude").asDouble();
            draft.longitude = location.get("longitude").asDouble();
        }

        JsonNode periods = place.path("regularOpeningHours").path("periods");
        if (!periods.isArray() || periods.isEmpty()) {
            draft.note = "Google has no opening hours for this place.";
            return;
        }
        applyHours(draft, periods);
    }

    /**
     * Folds Google's week (0 = Sunday) into the site's three rows: Mon-Fri (Monday's hours),
     * Saturday and Sunday. A day split by a lunch break becomes earliest opening to latest closing.
     */
    private static void applyHours(Draft draft, JsonNode periods) {
        // Open 24 hours: a single period that opens and never closes.
        if (periods.size() == 1 && periods.get(0).path("close").isMissingNode()) {
            LocalTime start = LocalTime.MIDNIGHT;
            LocalTime end = LocalTime.of(23, 59);
            draft.setDay(1, start, end);
            draft.setDay(6, start, end);
            draft.setDay(0, start, end);
            draft.hoursFound = true;
            draft.note = "Google lists this place as open 24 hours.";
            return;
        }

        LocalTime[][] days = new LocalTime[7][];
        for (JsonNode period : periods) {
            JsonNode open = period.path("open");
            JsonNode close = period.path("close");
            int day = open.path("day").asInt(-1);
            if (day < 0 || day > 6 || close.isMissingNode()) {
                continue;
            }
            LocalTime opens = LocalTime.of(open.path("hour").asInt(), open.path("minute").asInt());
            LocalTime closes = LocalTime.of(close.path("hour").asInt(), close.path("minute").asInt());
            // Each row is one day, so closing after midnight is shown as closing at 23:59.
            if (close.path("day").asInt(day) != day) {
                closes = LocalTime.of(23, 59);
            }
            if (days[day] == null) {
                days[day] = new LocalTime[]{opens, closes};
            } else {
                if (opens.isBefore(days[day][0])) {
                    days[day][0] = opens;
                }
                if (closes.isAfter(days[day][1])) {
                    days[day][1] = closes;
                }
            }
        }

        LocalTime[] monday = days[1];
        draft.setDay(1, monday == null ? null : monday[0], monday == null ? null : monday[1]);
        draft.setDay(6, days[6] == null ? null : days[6][0], days[6] == null ? null : days[6][1]);
        draft.setDay(0, days[0] == null ? null : days[0][0], days[0] == null ? null : days[0][1]);
        draft.hoursFound = true;

        boolean weekdaysDiffer = false;
        for (int day = 2; day <= 5; day++) {
            weekdaysDiffer |= !Arrays.equals(days[day], monday);
        }
        draft.note = weekdaysDiffer
                ? "Opening hours filled in from Google. They differ between weekdays, so Monday's are used "
                        + "for Mon-Fri - check them before saving."
                : "Opening hours filled in from Google - check them before saving.";
    }

    /** The result while it's being put together. */
    private static final class Draft {
        String name;
        String address;
        Double latitude;
        Double longitude;
        String mapsUrl;
        boolean hoursFound;
        LocalTime weekdayOpen;
        LocalTime weekdayClose;
        LocalTime saturdayOpen;
        LocalTime saturdayClose;
        LocalTime sundayOpen;
        LocalTime sundayClose;
        String note;

        /** 1 = the Mon-Fri row, 6 = Saturday, 0 = Sunday. */
        void setDay(int day, LocalTime open, LocalTime close) {
            if (day == 1) {
                weekdayOpen = open;
                weekdayClose = close;
            } else if (day == 6) {
                saturdayOpen = open;
                saturdayClose = close;
            } else if (day == 0) {
                sundayOpen = open;
                sundayClose = close;
            }
        }

        MapsLookupResult toResult() {
            return new MapsLookupResult(name, address, latitude, longitude, mapsUrl, hoursFound,
                    hhmm(weekdayOpen), hhmm(weekdayClose), hhmm(saturdayOpen), hhmm(saturdayClose),
                    hhmm(sundayOpen), hhmm(sundayClose), note);
        }

        private static String hhmm(LocalTime time) {
            return time == null ? null : time.toString();
        }
    }
}
