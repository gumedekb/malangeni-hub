package co.za.malangeniblog.service;

import co.za.malangeniblog.domain.Event;
import co.za.malangeniblog.domain.EventStatus;
import co.za.malangeniblog.domain.EventTag;
import co.za.malangeniblog.domain.User;
import co.za.malangeniblog.exception.BadRequestException;
import co.za.malangeniblog.exception.ResourceNotFoundException;
import co.za.malangeniblog.repository.EventRepository;
import co.za.malangeniblog.repository.UserRepository;
import co.za.malangeniblog.security.SecurityUtil;
import co.za.malangeniblog.util.IdGenerator;
import co.za.malangeniblog.util.RepositoryValidationHelper;
import co.za.malangeniblog.util.ValidationUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

/**
 * Member-submitted events with hub-team approval.
 *
 * <p>Two layers of checking, like badge requests: the form and {@link #validate} enforce the
 * required fields and their formats; anything a form can't judge (a picture would help, the
 * venue is wrong) goes back to the organiser as NEEDS_CHANGES with a note.
 */
@Service
public class EventService {

    /** Events are entered in Malangeni local time; the server itself may run in UTC. */
    public static final ZoneId ZONE = ZoneId.of("Africa/Johannesburg");

    private static final int MIN_DESCRIPTION = 5;
    private static final int MAX_NOTE = 1000;

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ImageStorageService imageStorageService;

    public static LocalDateTime now() {
        return LocalDateTime.now(ZONE);
    }

    /** An event stays listed for the whole of its day and disappears from the next midnight. */
    public static LocalDateTime startOfToday() {
        return LocalDate.now(ZONE).atStartOfDay();
    }

    public Event createEvent(Event input) {
        String userId = SecurityUtil.requireCurrentUserId();
        requireNotBanned(userId);

        Event event = new Event();
        event.setId(IdGenerator.generateId());
        applyEditableFields(event, input);
        if (event.getTag() == null) {
            event.setTag(EventTag.FUN);
        }
        requireFuture(event.getStartAt());
        validate(event);
        event.setOrganiserId(userId);
        event.setCreatedAt(now());
        // The hub team's own events need no second pair of eyes.
        if (SecurityUtil.isCurrentUserStaff()) {
            markReviewed(event, EventStatus.APPROVED, userId, null);
        } else {
            event.setStatus(EventStatus.PENDING);
        }
        return eventRepository.save(event);
    }

    /** Approved events are public; pending ones only to their organiser and the hub team. */
    public Optional<Event> getEventById(String id) {
        RepositoryValidationHelper.validateNotEmpty(id, "Event ID");
        return eventRepository.findById(id).filter(this::canView);
    }

    public Page<Event> getUpcomingEvents(Pageable pageable) {
        return eventRepository.findByStatusAndStartAtGreaterThanEqualOrderByStartAtAsc(
                EventStatus.APPROVED, startOfToday(), pageable);
    }

    /** The organiser's own upcoming events in every status, so they can follow the review. */
    public List<Event> getMyEvents(String userId) {
        return eventRepository.findByOrganiserIdAndStartAtGreaterThanEqualOrderByStartAtAsc(userId, startOfToday());
    }

    public Page<Event> getForReview(EventStatus status, Pageable pageable) {
        return eventRepository.findByStatusAndStartAtGreaterThanEqualOrderByCreatedAtAsc(
                status, startOfToday(), pageable);
    }

    /**
     * Organiser or hub team. An organiser's edit sends the event back to PENDING - what was
     * approved is no longer what would be shown.
     */
    public Event updateEvent(String id, Event input) {
        Event existing = find(id);
        if (!SecurityUtil.isCurrentUserStaff()) {
            requireNotBanned(SecurityUtil.requireCurrentUserId());
        }
        LocalDateTime previousStart = existing.getStartAt();
        applyEditableFields(existing, input);
        if (!existing.getStartAt().equals(previousStart)) {
            requireFuture(existing.getStartAt());
        }
        validate(existing);
        if (!SecurityUtil.isCurrentUserStaff()) {
            existing.setStatus(EventStatus.PENDING);
        }
        return eventRepository.save(existing);
    }

    public Event approve(String id, String note) {
        Event event = find(id);
        if (event.getStatus() == EventStatus.APPROVED) {
            throw new BadRequestException("This event is already approved");
        }
        markReviewed(event, EventStatus.APPROVED, SecurityUtil.requireCurrentUserId(), note);
        return eventRepository.save(event);
    }

    /** Sends the event back to its organiser (hidden again if it was public). */
    public Event requestChanges(String id, String note) {
        Event event = find(id);
        markReviewed(event, EventStatus.NEEDS_CHANGES, SecurityUtil.requireCurrentUserId(), note);
        return eventRepository.save(event);
    }

    public Event uploadImage(String id, MultipartFile file) {
        Event event = find(id);
        event.setImageUrl(imageStorageService.uploadEventImage(id, file));
        if (!SecurityUtil.isCurrentUserStaff()) {
            event.setStatus(EventStatus.PENDING);
        }
        return eventRepository.save(event);
    }

    /** Organiser cancelling, or the hub team removing it. The picture goes with it. */
    public void deleteEvent(String id) {
        Event event = find(id);
        remove(event);
    }

    /** Housekeeping for EventCleanupJob: deletes every event whose date has passed. */
    public int deletePastEvents() {
        List<Event> past = eventRepository.findByStartAtBefore(startOfToday());
        past.forEach(this::remove);
        return past.size();
    }

    private void remove(Event event) {
        if (event.getImageUrl() != null) {
            imageStorageService.deleteEventImage(event.getId());
        }
        eventRepository.deleteById(event.getId());
    }

    private Event find(String id) {
        RepositoryValidationHelper.validateNotEmpty(id, "Event ID");
        return eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + id));
    }

    private boolean canView(Event event) {
        if (event.getStatus() == EventStatus.APPROVED) {
            return true;
        }
        return SecurityUtil.getCurrentUserId()
                .map(userId -> userId.equals(event.getOrganiserId()) || SecurityUtil.isCurrentUserStaff())
                .orElse(false);
    }

    private void markReviewed(Event event, EventStatus status, String reviewerId, String note) {
        ValidationUtil.validateMaxLength(note, MAX_NOTE, "Note");
        event.setStatus(status);
        event.setReviewedByUserId(reviewerId);
        event.setReviewedAt(now());
        event.setReviewNote(RepositoryValidationHelper.isNullOrEmpty(note) ? null : note.trim());
    }

    /** Client-editable fields only; status, organiser, picture and review data are server-owned. */
    private void applyEditableFields(Event target, Event input) {
        if (input.getTitle() != null) {
            target.setTitle(input.getTitle().trim());
        }
        if (input.getDescription() != null) {
            target.setDescription(input.getDescription().trim());
        }
        if (input.getLocation() != null) {
            target.setLocation(input.getLocation().trim());
        }
        if (input.getStartAt() != null) {
            target.setStartAt(input.getStartAt());
        }
        if (input.getTag() != null) {
            target.setTag(input.getTag());
        }
        if (input.getContactNumber() != null) {
            target.setContactNumber(input.getContactNumber());
        }
    }

    /** Layer 1 on the server: required fields, in a usable format. Same rules as the form. */
    private void validate(Event event) {
        RepositoryValidationHelper.validateNotEmpty(event.getTitle(), "Title");
        ValidationUtil.validateMaxLength(event.getTitle(), ValidationUtil.MAX_SHORT_TEXT, "Title");
        if (event.getStartAt() == null) {
            throw new BadRequestException("Date and start time are required");
        }
        RepositoryValidationHelper.validateNotEmpty(event.getLocation(), "Location");
        ValidationUtil.validateMaxLength(event.getLocation(), ValidationUtil.MAX_SHORT_TEXT, "Location");
        event.setContactNumber(ValidationUtil.requireSaCellphone(event.getContactNumber(), "Contact number"));
        String description = event.getDescription() == null ? "" : event.getDescription().trim();
        if (description.length() < MIN_DESCRIPTION) {
            throw new BadRequestException("Description must be at least " + MIN_DESCRIPTION + " characters");
        }
        ValidationUtil.validateMaxLength(description, ValidationUtil.MAX_LONG_TEXT, "Description");
    }

    private void requireFuture(LocalDateTime startAt) {
        if (startAt == null) {
            throw new BadRequestException("Date and start time are required");
        }
        if (!startAt.isAfter(now())) {
            throw new BadRequestException("The event must start in the future");
        }
    }

    /** Same rule as news: a posting ban blocks writing, re-read on every attempt. */
    private void requireNotBanned(String userId) {
        userRepository.findById(userId)
                .filter(User::isBannedFromPosting)
                .ifPresent(banned -> {
                    throw new BadRequestException(banned.getBanReason() == null
                            ? "You are currently banned from posting"
                            : "You are currently banned from posting: " + banned.getBanReason());
                });
    }
}
