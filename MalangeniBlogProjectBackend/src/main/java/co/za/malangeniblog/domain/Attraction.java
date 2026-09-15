package co.za.malangeniblog.domain;

import jakarta.persistence.*;

import java.time.LocalTime;

@Entity
@Table(name = "attractions")
public class Attraction {

    @Id
    private String id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(nullable = false)
    private String location;
    
    private String imageUrl;
    
    private String latitude;
    
    private String longitude;
    
    private String categoryId;
    
    @ManyToOne
    @JoinColumn(name = "categoryId", insertable = false, updatable = false)
    private Category category;

    /** The place on Google Maps, for "Get directions". */
    @Column(length = 512)
    private String mapsUrl;

    // Optional opening hours, same shape as the library: a null pair means closed that day,
    // all six null means the hours aren't listed (a park, say).
    private LocalTime weekdayOpen;

    private LocalTime weekdayClose;

    private LocalTime saturdayOpen;

    private LocalTime saturdayClose;

    private LocalTime sundayOpen;

    private LocalTime sundayClose;

    @Transient
    private Double averageRating;

    @Transient
    private Long ratingCount;

    // Required by JPA/Jackson, which instantiate the entity reflectively before populating
    // fields. Protected rather than public so application code still goes through the builder.
    protected Attraction() {
    }

    private Attraction(Builder builder) {
        this.id = builder.id;
        this.name = builder.name;
        this.description = builder.description;
        this.location = builder.location;
        this.imageUrl = builder.imageUrl;
        this.latitude = builder.latitude;
        this.longitude = builder.longitude;
        this.categoryId = builder.categoryId;
    }

    public static Builder builder() {
        return new Builder();
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public String getLocation() {
        return location;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public String getLatitude() {
        return latitude;
    }

    public String getLongitude() {
        return longitude;
    }

    public String getCategoryId() {
        return categoryId;
    }

    public void setId(String id) {
        this.id = id;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public void setLatitude(String latitude) {
        this.latitude = latitude;
    }

    public void setLongitude(String longitude) {
        this.longitude = longitude;
    }

    public void setCategoryId(String categoryId) {
        this.categoryId = categoryId;
    }

    public Category getCategory() {
        return category;
    }

    public void setCategory(Category category) {
        this.category = category;
    }

    public Double getAverageRating() {
        return averageRating;
    }

    public void setAverageRating(Double averageRating) {
        this.averageRating = averageRating;
    }

    public Long getRatingCount() {
        return ratingCount;
    }

    public void setRatingCount(Long ratingCount) {
        this.ratingCount = ratingCount;
    }

    public String getMapsUrl() {
        return mapsUrl;
    }

    public void setMapsUrl(String mapsUrl) {
        this.mapsUrl = mapsUrl;
    }

    public LocalTime getWeekdayOpen() {
        return weekdayOpen;
    }

    public void setWeekdayOpen(LocalTime weekdayOpen) {
        this.weekdayOpen = weekdayOpen;
    }

    public LocalTime getWeekdayClose() {
        return weekdayClose;
    }

    public void setWeekdayClose(LocalTime weekdayClose) {
        this.weekdayClose = weekdayClose;
    }

    public LocalTime getSaturdayOpen() {
        return saturdayOpen;
    }

    public void setSaturdayOpen(LocalTime saturdayOpen) {
        this.saturdayOpen = saturdayOpen;
    }

    public LocalTime getSaturdayClose() {
        return saturdayClose;
    }

    public void setSaturdayClose(LocalTime saturdayClose) {
        this.saturdayClose = saturdayClose;
    }

    public LocalTime getSundayOpen() {
        return sundayOpen;
    }

    public void setSundayOpen(LocalTime sundayOpen) {
        this.sundayOpen = sundayOpen;
    }

    public LocalTime getSundayClose() {
        return sundayClose;
    }

    public void setSundayClose(LocalTime sundayClose) {
        this.sundayClose = sundayClose;
    }

    public static class Builder {
        private String id;
        private String name;
        private String description;
        private String location;
        private String imageUrl;
        private String latitude;
        private String longitude;
        private String categoryId;

        public Builder id(String id) {
            this.id = id;
            return this;
        }

        public Builder name(String name) {
            this.name = name;
            return this;
        }

        public Builder description(String description) {
            this.description = description;
            return this;
        }

        public Builder location(String location) {
            this.location = location;
            return this;
        }

        public Builder imageUrl(String imageUrl) {
            this.imageUrl = imageUrl;
            return this;
        }

        public Builder latitude(String latitude) {
            this.latitude = latitude;
            return this;
        }

        public Builder longitude(String longitude) {
            this.longitude = longitude;
            return this;
        }

        public Builder categoryId(String categoryId) {
            this.categoryId = categoryId;
            return this;
        }

        public Attraction build() {
            return new Attraction(this);
        }
    }
}
