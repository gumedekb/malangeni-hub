package co.za.malangeniblog.domain;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "group_memberships", uniqueConstraints = @UniqueConstraint(columnNames = {"groupId", "userId"}))
public class GroupMembership {

    @Id
    private String id;

    @Column(nullable = false)
    private String groupId;

    @ManyToOne
    @JoinColumn(name = "groupId", insertable = false, updatable = false)
    private Group group;

    @Column(nullable = false)
    private String userId;

    @ManyToOne
    @JoinColumn(name = "userId", insertable = false, updatable = false)
    @JsonSerialize(using = PublicUserSerializer.class)
    private User user;

    @Column(nullable = false)
    private LocalDateTime joinedAt;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getGroupId() {
        return groupId;
    }

    public void setGroupId(String groupId) {
        this.groupId = groupId;
    }

    public Group getGroup() {
        return group;
    }

    public void setGroup(Group group) {
        this.group = group;
    }

    public String getUserId() {
        return userId;
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

    public LocalDateTime getJoinedAt() {
        return joinedAt;
    }

    public void setJoinedAt(LocalDateTime joinedAt) {
        this.joinedAt = joinedAt;
    }
}
