package co.za.malangeniblog.domain;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "sponsors")
public class Sponsor {

    @Id
    private String id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String pitch;

    private String imageUrl;

    private String targetUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SponsorPlacement placement;

    // Optional link to a local shop so its ad can point at the shop's own page.
    private String shopId;

    @ManyToOne
    @JoinColumn(name = "shopId", insertable = false, updatable = false)
    private Shop shop;

    // Scheduling window; either end may be null for "no bound".
    private LocalDateTime startAt;

    private LocalDateTime endAt;

    @Column(nullable = false)
    private boolean active;

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

    public String getPitch() {
        return pitch;
    }

    public void setPitch(String pitch) {
        this.pitch = pitch;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getTargetUrl() {
        return targetUrl;
    }

    public void setTargetUrl(String targetUrl) {
        this.targetUrl = targetUrl;
    }

    public SponsorPlacement getPlacement() {
        return placement;
    }

    public void setPlacement(SponsorPlacement placement) {
        this.placement = placement;
    }

    public String getShopId() {
        return shopId;
    }

    public void setShopId(String shopId) {
        this.shopId = shopId;
    }

    public Shop getShop() {
        return shop;
    }

    public void setShop(Shop shop) {
        this.shop = shop;
    }

    public LocalDateTime getStartAt() {
        return startAt;
    }

    public void setStartAt(LocalDateTime startAt) {
        this.startAt = startAt;
    }

    public LocalDateTime getEndAt() {
        return endAt;
    }

    public void setEndAt(LocalDateTime endAt) {
        this.endAt = endAt;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
