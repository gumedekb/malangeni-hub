package co.za.malangeniblog.dto;

/** Optional reason shown to the banned member when they try to post. */
public class BanRequest {

    private String reason;

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
