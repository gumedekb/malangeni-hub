package co.za.malangeniblog.controller;

import co.za.malangeniblog.domain.Event;
import co.za.malangeniblog.domain.EventStatus;
import co.za.malangeniblog.dto.ReviewNoteRequest;
import co.za.malangeniblog.security.SecurityUtil;
import co.za.malangeniblog.service.EventService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/events")
public class EventController {

    private static final String STAFF_OR_ORGANISER =
            "hasAnyRole('ADMIN','MODERATOR') or @eventSecurity.isOrganiser(#id, authentication.principal.id)";

    @Autowired
    private EventService eventService;

    /** Any signed-in member. Starts PENDING unless the submitter is on the hub team. */
    @PostMapping
    public ResponseEntity<Event> createEvent(@RequestBody Event event) {
        return ResponseEntity.status(HttpStatus.CREATED).body(eventService.createEvent(event));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Event> getEventById(@PathVariable String id) {
        Optional<Event> event = eventService.getEventById(id);
        return event.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    /** Public: approved events from today onwards. */
    @GetMapping("/upcoming")
    public ResponseEntity<Page<Event>> getUpcomingEvents(@PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(eventService.getUpcomingEvents(pageable));
    }

    /** Same as /upcoming - unapproved and past events are never listed publicly. */
    @GetMapping
    public ResponseEntity<Page<Event>> getAllEvents(@PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(eventService.getUpcomingEvents(pageable));
    }

    /** The caller's own upcoming events, in every status. */
    @GetMapping("/mine")
    public ResponseEntity<List<Event>> getMyEvents() {
        return ResponseEntity.ok(eventService.getMyEvents(SecurityUtil.requireCurrentUserId()));
    }

    /** Hub-team approval queue. */
    @GetMapping("/review")
    @PreAuthorize("hasAnyRole('ADMIN','MODERATOR')")
    public ResponseEntity<Page<Event>> getForReview(
            @RequestParam(defaultValue = "PENDING") EventStatus status,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(eventService.getForReview(status, pageable));
    }

    @PutMapping("/{id}")
    @PreAuthorize(STAFF_OR_ORGANISER)
    public ResponseEntity<Event> updateEvent(@PathVariable String id, @RequestBody Event event) {
        return ResponseEntity.ok(eventService.updateEvent(id, event));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN','MODERATOR')")
    public ResponseEntity<Event> approve(@PathVariable String id,
                                         @RequestBody(required = false) ReviewNoteRequest body) {
        return ResponseEntity.ok(eventService.approve(id, body == null ? null : body.getNote()));
    }

    @PostMapping("/{id}/needs-changes")
    @PreAuthorize("hasAnyRole('ADMIN','MODERATOR')")
    public ResponseEntity<Event> requestChanges(@PathVariable String id,
                                                @RequestBody(required = false) ReviewNoteRequest body) {
        return ResponseEntity.ok(eventService.requestChanges(id, body == null ? null : body.getNote()));
    }

    /** Optional picture (multipart field {@code file}). */
    @PostMapping(value = "/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize(STAFF_OR_ORGANISER)
    public ResponseEntity<Event> uploadImage(@PathVariable String id, @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(eventService.uploadImage(id, file));
    }

    /** Organiser cancelling, or the hub team removing it. */
    @DeleteMapping("/{id}")
    @PreAuthorize(STAFF_OR_ORGANISER)
    public ResponseEntity<Void> deleteEvent(@PathVariable String id) {
        eventService.deleteEvent(id);
        return ResponseEntity.noContent().build();
    }
}
