package co.za.malangeniblog.dto;

/** Optional staff note on a badge request decision; shown to the member on rejection. */
public class ReviewNoteRequest {

    private String note;

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
