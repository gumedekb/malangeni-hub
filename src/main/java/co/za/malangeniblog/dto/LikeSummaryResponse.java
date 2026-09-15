package co.za.malangeniblog.dto;

public class LikeSummaryResponse {

    private long likeCount;
    private boolean likedByCurrentUser;

    public LikeSummaryResponse(long likeCount, boolean likedByCurrentUser) {
        this.likeCount = likeCount;
        this.likedByCurrentUser = likedByCurrentUser;
    }

    public long getLikeCount() {
        return likeCount;
    }

    public boolean isLikedByCurrentUser() {
        return likedByCurrentUser;
    }
}
