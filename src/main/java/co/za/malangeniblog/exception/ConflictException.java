package co.za.malangeniblog.exception;

/** The request is valid but clashes with current state (e.g. a badge request already pending). */
public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}
