package co.za.malangeniblog.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Malangeni Library's public details, edited by the hub team. There is only ever one row
 * (id {@code main}). A null opening/closing pair means the library is closed that day.
 */
@Entity
@Table(name = "library_info")
public class LibraryInfo {

    @Id
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(length = 1000)
    private String about;

    private String location;

    @Column(length = 512)
    private String mapsUrl;

    private LocalTime weekdayOpen;

    private LocalTime weekdayClose;

    private LocalTime saturdayOpen;

    private LocalTime saturdayClose;

    private LocalTime sundayOpen;

    private LocalTime sundayClose;

    private LocalDateTime updatedAt;

    @JsonIgnore
    private String updatedByUserId;

    public LibraryInfo() {}

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

    public String getAbout() {
        return about;
    }

    public void setAbout(String about) {
        this.about = about;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
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

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getUpdatedByUserId() {
        return updatedByUserId;
    }

    public void setUpdatedByUserId(String updatedByUserId) {
        this.updatedByUserId = updatedByUserId;
    }
}
