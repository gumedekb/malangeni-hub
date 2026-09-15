package co.za.malangeniblog.dto;

public class RatingSummaryResponse {

    private Double averageRating;
    private long ratingCount;

    public RatingSummaryResponse(Double averageRating, long ratingCount) {
        this.averageRating = averageRating;
        this.ratingCount = ratingCount;
    }

    public Double getAverageRating() {
        return averageRating;
    }

    public long getRatingCount() {
        return ratingCount;
    }
}
