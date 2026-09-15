package co.za.malangeniblog.domain;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "contact_messages")
public class ContactMessage {

    @Id
    private String id;
    
    @Column(nullable = false)
    private String subject;
    
    @Column(columnDefinition = "TEXT", nullable = false)
    private String message;
    
    @Column(nullable = false)
    private LocalDateTime dateSent;

    private String userId;

    @ManyToOne
    @JoinColumn(name = "userId", insertable = false, updatable = false)
    @JsonSerialize(using = PublicUserSerializer.class)
    private User user;

    public ContactMessage() {}

    public ContactMessage(String id, String subject, String message, LocalDateTime dateSent, String userId) {
        this.id = id;
        this.subject = subject;
        this.message = message;
        this.dateSent = dateSent;
        this.userId = userId;
    }

    public String getId() {
        return id;
    }

    public String getSubject() {
        return subject;
    }

    public String getMessage() {
        return message;
    }

    public LocalDateTime getDateSent() {
        return dateSent;
    }

    public String getUserId() {
        return userId;
    }

    public void setId(String id) {
        this.id = id;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public void setDateSent(LocalDateTime dateSent) {
        this.dateSent = dateSent;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }
}
