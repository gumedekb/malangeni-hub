package co.za.malangeniblog.domain;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * A community event. Any member may submit one; it stays PENDING - visible only to its organiser
 * and the hub team - until an admin or moderator approves it (same shape as badge requests).
 * Deleted automatically once its date has passed (see EventCleanupJob).
 */
@Entity
@Table(name = "events")
public class Event {

    @Id
    private String id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String location;

    /** Local Malangeni time (Africa/Johannesburg), not UTC. */
    @Column(nullable = false)
    private LocalDateTime startAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EventTag tag;

    /** SA cellphone number, shown publicly so people can ask the organiser for details. */
    private String contactNumber;

    /** Optional picture, uploaded through the backend to Cloudinary - never a client-supplied URL. */
    @Column(length = 512)
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EventStatus status;

    /** The hub team's note - what to change, or how it was checked. Shown to the organiser. */
    @Column(length = 1000)
    private String reviewNote;

    private String reviewedByUserId;

    @ManyToOne
    @JoinColumn(name = "reviewedByUserId", insertable = false, updatable = false)
    @JsonSerialize(using = PublicUserSerializer.class)
    private User reviewedBy;

    private LocalDateTime reviewedAt;

    /** Whoever submitted it. They may edit or cancel it. */
    private String organiserId;

    @ManyToOne
    @JoinColumn(name = "organiserId", insertable = false, updatable = false)
    @JsonSerialize(using = PublicUserSerializer.class)
    private User organiser;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public LocalDateTime getStartAt() {
        return startAt;
    }

    public void setStartAt(LocalDateTime startAt) {
        this.startAt = startAt;
    }

    public EventTag getTag() {
        return tag;
    }

    public void setTag(EventTag tag) {
        this.tag = tag;
    }

    public String getContactNumber() {
        return contactNumber;
    }

    public void setContactNumber(String contactNumber) {
        this.contactNumber = contactNumber;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public EventStatus getStatus() {
        return status;
    }

    public void setStatus(EventStatus status) {
        this.status = status;
    }

    public String getReviewNote() {
        return reviewNote;
    }

    public void setReviewNote(String reviewNote) {
        this.reviewNote = reviewNote;
    }

    public String getReviewedByUserId() {
        return reviewedByUserId;
    }

    public void setReviewedByUserId(String reviewedByUserId) {
        this.reviewedByUserId = reviewedByUserId;
    }

    public User getReviewedBy() {
        return reviewedBy;
    }

    public LocalDateTime getReviewedAt() {
        return reviewedAt;
    }

    public void setReviewedAt(LocalDateTime reviewedAt) {
        this.reviewedAt = reviewedAt;
    }

    public String getOrganiserId() {
        return organiserId;
    }

    public void setOrganiserId(String organiserId) {
        this.organiserId = organiserId;
    }

    public User getOrganiser() {
        return organiser;
    }

    public void setOrganiser(User organiser) {
        this.organiser = organiser;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
