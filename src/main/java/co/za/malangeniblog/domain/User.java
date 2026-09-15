package co.za.malangeniblog.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {

    @Id
    private String id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(unique = true, nullable = false)
    private String email;

    /**
     * The member's name from their Google account (e.g. "Thabo Mokoena"), kept in step on every
     * sign-in by FirebaseUserService. Shown to other members instead of the username.
     */
    private String displayName;

    /**
     * Firebase's stable identifier for the account. This is the lookup key after the cutover -
     * it never changes, unlike username or email, which the user can edit. Never serialized:
     * the frontend compares against {@code id}, never the Firebase uid.
     */
    @JsonIgnore
    @Column(unique = true)
    private String firebaseUid;

    /** URL of the member's profile picture, hosted on Cloudinary (see ImageStorageService). */
    @Column(length = 512)
    private String profileImageUrl;

    @Enumerated(EnumType.STRING)
    private Role role;

    private LocalDateTime createdAt;

    /**
     * Chosen on first sign-in. Null means the member has not answered yet, which is the
     * frontend's cue to show the "member or business owner?" step.
     */
    @Enumerated(EnumType.STRING)
    private AccountType accountType;

    /**
     * Status of the member's latest business badge request, or null if they never made one.
     * Denormalised from {@code badge_requests} so the badge can be rendered without a query.
     */
    @Enumerated(EnumType.STRING)
    private BadgeRequestStatus badgeRequestStatus;

    /**
     * Staff account that works behind the scenes: keeps its real permissions, but is shown to
     * the public as an ordinary member (see PublicUserSerializer). Driven by app.backstage-emails.
     */
    @Column(nullable = false)
    private boolean backstage = false;

    /**
     * A posting ban, not an account ban - a banned member can still read, comment and use the
     * rest of the site. Deliberately not a {@code Role} value: role answers "what kind of member
     * is this", and collapsing a ban into it would lose their real role for when it is lifted.
     */
    @Column(nullable = false)
    private boolean bannedFromPosting = false;

    private String banReason;

    private LocalDateTime bannedAt;

    public User() {}

    /** Recognition badge, separate from role: only a confirmed business gets one. */
    public String getBadge() {
        return badgeRequestStatus == BadgeRequestStatus.APPROVED ? "BUSINESS" : null;
    }

    public String getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public String getEmail() {
        return email;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public boolean isBannedFromPosting() {
        return bannedFromPosting;
    }

    public void setBannedFromPosting(boolean bannedFromPosting) {
        this.bannedFromPosting = bannedFromPosting;
    }

    public String getBanReason() {
        return banReason;
    }

    public void setBanReason(String banReason) {
        this.banReason = banReason;
    }

    public LocalDateTime getBannedAt() {
        return bannedAt;
    }

    public void setBannedAt(LocalDateTime bannedAt) {
        this.bannedAt = bannedAt;
    }

    public String getProfileImageUrl() {
        return profileImageUrl;
    }

    public void setProfileImageUrl(String profileImageUrl) {
        this.profileImageUrl = profileImageUrl;
    }

    public String getFirebaseUid() {
        return firebaseUid;
    }

    public void setFirebaseUid(String firebaseUid) {
        this.firebaseUid = firebaseUid;
    }

    public Role getRole() {
        return role;
    }

    public void setId(String id) {
        this.id = id;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public AccountType getAccountType() {
        return accountType;
    }

    public void setAccountType(AccountType accountType) {
        this.accountType = accountType;
    }

    public BadgeRequestStatus getBadgeRequestStatus() {
        return badgeRequestStatus;
    }

    public void setBadgeRequestStatus(BadgeRequestStatus badgeRequestStatus) {
        this.badgeRequestStatus = badgeRequestStatus;
    }

    public boolean isBackstage() {
        return backstage;
    }

    public void setBackstage(boolean backstage) {
        this.backstage = backstage;
    }
}
