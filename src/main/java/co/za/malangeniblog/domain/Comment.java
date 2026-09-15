package co.za.malangeniblog.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "comments")
public class Comment {

    @Id
    private String id;

    @Column(nullable = false)
    private String postId;

    // The comment is always read in the context of its post, so don't repeat the whole post.
    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "postId", insertable = false, updatable = false)
    private Post post;

    @Column(nullable = false)
    private String authorId;

    @ManyToOne
    @JoinColumn(name = "authorId", insertable = false, updatable = false)
    @JsonSerialize(using = PublicUserSerializer.class)
    private User author;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String body;

    private String parentCommentId;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getPostId() {
        return postId;
    }

    public void setPostId(String postId) {
        this.postId = postId;
    }

    public Post getPost() {
        return post;
    }

    public void setPost(Post post) {
        this.post = post;
    }

    public String getAuthorId() {
        return authorId;
    }

    public void setAuthorId(String authorId) {
        this.authorId = authorId;
    }

    public User getAuthor() {
        return author;
    }

    public void setAuthor(User author) {
        this.author = author;
    }

    public String getBody() {
        return body;
    }

    public void setBody(String body) {
        this.body = body;
    }

    public String getParentCommentId() {
        return parentCommentId;
    }

    public void setParentCommentId(String parentCommentId) {
        this.parentCommentId = parentCommentId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
