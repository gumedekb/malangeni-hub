package co.za.malangeniblog.repository;

import co.za.malangeniblog.domain.GroupMembership;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GroupMembershipRepository extends JpaRepository<GroupMembership, String> {
    Optional<GroupMembership> findByGroupIdAndUserId(String groupId, String userId);

    boolean existsByGroupIdAndUserId(String groupId, String userId);

    List<GroupMembership> findByGroupId(String groupId);

    long countByGroupId(String groupId);

    void deleteByGroupIdAndUserId(String groupId, String userId);

    void deleteByGroupId(String groupId);
}
