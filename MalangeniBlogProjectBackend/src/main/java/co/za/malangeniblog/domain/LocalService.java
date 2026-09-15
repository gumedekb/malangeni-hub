package co.za.malangeniblog.domain;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * A service a member offers (plumbing, transport, tutoring...). Anyone may list one; it stays
 * PENDING - visible only to its provider and the hub team - until an admin or moderator
 * approves it. Same review flow as events.
 */
@Entity
@Table(name = "local_services")
public class LocalService {

    @Id
    private String id;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ServiceCategory serviceCategory;

    /** Short description, 5-1000 characters - people can call for more. */
    @Column(length = 1000)
    private String description;

    /** SA cellphone number, shown publicly so people can book the service. */
    private String contactNumber;

    /** Where the provider works, e.g. "Malangeni and surrounding villages". */
    private String areaServed;

    /** Optional free text, e.g. "Mon-Fri 08:00-17:00, Sat mornings". */
    private String operatingHours;

    /** Optional picture, uploaded through the backend to Cloudinary. */
    @Column(length = 512)
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ApprovalStatus status;

    @Column(length = 1000)
    private String reviewNote;

    private String reviewedByUserId;

    @ManyToOne
    @JoinColumn(name = "reviewedByUserId", insertable = false, updatable = false)
    @JsonSerialize(using = PublicUserSerializer.class)
    private User reviewedBy;

    private LocalDateTime reviewedAt;

    /** Whoever listed it. They may edit or remove it. */
    private String providerId;

    @ManyToOne
    @JoinColumn(name = "providerId", insertable = false, updatable = false)
    @JsonSerialize(using = PublicUserSerializer.class)
    private User provider;

    private LocalDateTime createdAt;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public ServiceCategory getServiceCategory() {
        return serviceCategory;
    }

    public void setServiceCategory(ServiceCategory serviceCategory) {
        this.serviceCategory = serviceCategory;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getContactNumber() {
        return contactNumber;
    }

    public void setContactNumber(String contactNumber) {
        this.contactNumber = contactNumber;
    }

    public String getAreaServed() {
        return areaServed;
    }

    public void setAreaServed(String areaServed) {
        this.areaServed = areaServed;
    }

    public String getOperatingHours() {
        return operatingHours;
    }

    public void setOperatingHours(String operatingHours) {
        this.operatingHours = operatingHours;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public ApprovalStatus getStatus() {
        return status;
    }

    public void setStatus(ApprovalStatus status) {
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

    public String getProviderId() {
        return providerId;
    }

    public void setProviderId(String providerId) {
        this.providerId = providerId;
    }

    public User getProvider() {
        return provider;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
