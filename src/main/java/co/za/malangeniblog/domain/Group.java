package co.za.malangeniblog.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "community_groups")
public class Group {

    @Id
    private String id;

    @Column(unique = true, nullable = false)
    private String name;

    private String icon;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Transient
    private Long memberCount;

    /** Null for anonymous requests, so the field is left out of the JSON. */
    @Transient
    private Boolean joinedByCurrentUser;

    public Boolean getJoinedByCurrentUser() {
        return joinedByCurrentUser;
    }

    public void setJoinedByCurrentUser(Boolean joinedByCurrentUser) {
        this.joinedByCurrentUser = joinedByCurrentUser;
    }

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

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Long getMemberCount() {
        return memberCount;
    }

    public void setMemberCount(Long memberCount) {
        this.memberCount = memberCount;
    }
}
