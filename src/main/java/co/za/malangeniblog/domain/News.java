package co.za.malangeniblog.domain;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "news")
public class News {

    @Id
    private String id;
    
    @Column(nullable = false)
    private String title;
    
    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;
    
    private String imageUrl;
    
    @Column(nullable = false)
    private LocalDateTime publishedAt;
    
    private String categoryId;

    /**
     * Who wrote it. Set server-side from the authenticated user, never from the request body -
     * otherwise a member could post under someone else's name. See TASKS.md Phase 9.
     */
    private String authorId;

    @ManyToOne
    @JoinColumn(name = "categoryId", insertable = false, updatable = false)
    private Category category;

    @ManyToOne
    @JoinColumn(name = "authorId", insertable = false, updatable = false)
    @JsonSerialize(using = PublicUserSerializer.class)
    private User author;

    // Required by JPA/Jackson, which instantiate the entity reflectively before populating
    // fields. Protected rather than public so application code still goes through the builder.
    protected News() {
    }

    private News(Builder builder) {
        this.id = builder.id;
        this.title = builder.title;
        this.content = builder.content;
        this.imageUrl = builder.imageUrl;
        this.publishedAt = builder.publishedAt;
        this.categoryId = builder.categoryId;
        this.authorId = builder.authorId;
    }

    public static Builder builder() {
        return new Builder();
    }

    public String getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getContent() {
        return content;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public LocalDateTime getPublishedAt() {
        return publishedAt;
    }

    public String getCategoryId() {
        return categoryId;
    }

    public void setId(String id) {
        this.id = id;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public void setPublishedAt(LocalDateTime publishedAt) {
        this.publishedAt = publishedAt;
    }

    public void setCategoryId(String categoryId) {
        this.categoryId = categoryId;
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

    public Category getCategory() {
        return category;
    }

    public void setCategory(Category category) {
        this.category = category;
    }

    public static class Builder {
        private String id;
        private String title;
        private String content;
        private String imageUrl;
        private LocalDateTime publishedAt;
        private String categoryId;
        private String authorId;

        public Builder id(String id) {
            this.id = id;
            return this;
        }

        public Builder title(String title) {
            this.title = title;
            return this;
        }

        public Builder content(String content) {
            this.content = content;
            return this;
        }

        public Builder imageUrl(String imageUrl) {
            this.imageUrl = imageUrl;
            return this;
        }

        public Builder publishedAt(LocalDateTime publishedAt) {
            this.publishedAt = publishedAt;
            return this;
        }

        public Builder categoryId(String categoryId) {
            this.categoryId = categoryId;
            return this;
        }

        public Builder authorId(String authorId) {
            this.authorId = authorId;
            return this;
        }

        public News build() {
            return new News(this);
        }
    }
}
