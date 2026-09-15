package co.za.malangeniblog.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "community_projects")
public class CommunityProject {

    @Id
    private String id;
    
    @Column(nullable = false)
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    private String organiser;
    
    private String imageUrl;
    
    private String categoryId;
    
    @ManyToOne
    @JoinColumn(name = "categoryId", insertable = false, updatable = false)
    private Category category;

    // Required by JPA/Jackson, which instantiate the entity reflectively before populating
    // fields. Protected rather than public so application code still goes through the builder.
    protected CommunityProject() {
    }

    private CommunityProject(Builder builder) {
        this.id = builder.id;
        this.title = builder.title;
        this.description = builder.description;
        this.organiser = builder.organiser;
        this.imageUrl = builder.imageUrl;
        this.categoryId = builder.categoryId;
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

    public String getDescription() {
        return description;
    }

    public String getOrganiser() {
        return organiser;
    }

    public String getImageUrl() {
        return imageUrl;
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

    public void setDescription(String description) {
        this.description = description;
    }

    public void setOrganiser(String organiser) {
        this.organiser = organiser;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
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

    public static class Builder {
        private String id;
        private String title;
        private String description;
        private String organiser;
        private String imageUrl;
        private String categoryId;

        public Builder id(String id) {
            this.id = id;
            return this;
        }

        public Builder title(String title) {
            this.title = title;
            return this;
        }

        public Builder description(String description) {
            this.description = description;
            return this;
        }

        public Builder organiser(String organiser) {
            this.organiser = organiser;
            return this;
        }

        public Builder imageUrl(String imageUrl) {
            this.imageUrl = imageUrl;
            return this;
        }

        public Builder categoryId(String categoryId) {
            this.categoryId = categoryId;
            return this;
        }

        public CommunityProject build() {
            return new CommunityProject(this);
        }
    }
}
