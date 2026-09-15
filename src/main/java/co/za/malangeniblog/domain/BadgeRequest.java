package co.za.malangeniblog.domain;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * A member asking staff to confirm they run a business. Approval grants the BUSINESS badge and
 * the BUSINESS_OWNER role; the request row is kept afterwards as the audit trail.
 *
 * <p>Deliberately asks only for what a business tells customers anyway - no ID numbers, ID
 * copies or bank details, which would not help verification and would be damaging to leak.
 */
@Entity
@Table(name = "badge_requests")
public class BadgeRequest {

    @Id
    private String id;

    @Column(nullable = false)
    private String userId;

    @ManyToOne
    @JoinColumn(name = "userId", insertable = false, updatable = false)
    @JsonSerialize(using = PublicUserSerializer.class)
    private User user;

    /** Null when the member did not say; staff settle it during verification. */
    @Enumerated(EnumType.STRING)
    private BusinessType businessType;

    @Column(nullable = false)
    private String businessName;

    private String category;

    private String location;

    private String contactNumber;

    /** Optional - only formal businesses have one, and even then it is not required. */
    private String registrationNumber;

    @Column(length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BadgeRequestStatus status;

    private String reviewedByUserId;

    /** Who verified (or rejected) it - the verification log shows this. */
    @ManyToOne
    @JoinColumn(name = "reviewedByUserId", insertable = false, updatable = false)
    @JsonSerialize(using = PublicUserSerializer.class)
    private User reviewedBy;

    public User getReviewedBy() {
        return reviewedBy;
    }

    /** Set when an approved badge is later taken away; the original approval stays recorded. */
    private String revokedByUserId;

    @ManyToOne
    @JoinColumn(name = "revokedByUserId", insertable = false, updatable = false)
    @JsonSerialize(using = PublicUserSerializer.class)
    private User revokedBy;

    private LocalDateTime revokedAt;

    @Column(length = 1000)
    private String revokeNote;

    public String getRevokedByUserId() {
        return revokedByUserId;
    }

    public void setRevokedByUserId(String revokedByUserId) {
        this.revokedByUserId = revokedByUserId;
    }

    public User getRevokedBy() {
        return revokedBy;
    }

    public LocalDateTime getRevokedAt() {
        return revokedAt;
    }

    public void setRevokedAt(LocalDateTime revokedAt) {
        this.revokedAt = revokedAt;
    }

    public String getRevokeNote() {
        return revokeNote;
    }

    public void setRevokeNote(String revokeNote) {
        this.revokeNote = revokeNote;
    }

    private LocalDateTime reviewedAt;

    /** Staff note - mainly the reason when a request is rejected, shown back to the member. */
    @Column(length = 1000)
    private String reviewNote;

    private LocalDateTime createdAt;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public User getUser() {
        return user;
    }

    public BusinessType getBusinessType() {
        return businessType;
    }

    public void setBusinessType(BusinessType businessType) {
        this.businessType = businessType;
    }

    public String getBusinessName() {
        return businessName;
    }

    public void setBusinessName(String businessName) {
        this.businessName = businessName;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getContactNumber() {
        return contactNumber;
    }

    public void setContactNumber(String contactNumber) {
        this.contactNumber = contactNumber;
    }

    public String getRegistrationNumber() {
        return registrationNumber;
    }

    public void setRegistrationNumber(String registrationNumber) {
        this.registrationNumber = registrationNumber;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BadgeRequestStatus getStatus() {
        return status;
    }

    public void setStatus(BadgeRequestStatus status) {
        this.status = status;
    }

    public String getReviewedByUserId() {
        return reviewedByUserId;
    }

    public void setReviewedByUserId(String reviewedByUserId) {
        this.reviewedByUserId = reviewedByUserId;
    }

    public LocalDateTime getReviewedAt() {
        return reviewedAt;
    }

    public void setReviewedAt(LocalDateTime reviewedAt) {
        this.reviewedAt = reviewedAt;
    }

    public String getReviewNote() {
        return reviewNote;
    }

    public void setReviewNote(String reviewNote) {
        this.reviewNote = reviewNote;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
