package co.za.malangeniblog.repository;

import co.za.malangeniblog.domain.BadgeRequest;
import co.za.malangeniblog.domain.BadgeRequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BadgeRequestRepository extends JpaRepository<BadgeRequest, String> {
    Page<BadgeRequest> findByStatusOrderByCreatedAtAsc(BadgeRequestStatus status, Pageable pageable);

    List<BadgeRequest> findByUserIdOrderByCreatedAtDesc(String userId);

    Optional<BadgeRequest> findFirstByUserIdAndStatusOrderByReviewedAtDesc(String userId, BadgeRequestStatus status);

    /** The verification log: every decision, ordered by its latest action (revocation or review). */
    @Query(value = "select r from BadgeRequest r where r.status <> :pending "
            + "order by coalesce(r.revokedAt, r.reviewedAt) desc",
            countQuery = "select count(r) from BadgeRequest r where r.status <> :pending")
    Page<BadgeRequest> findDecisionLog(@Param("pending") BadgeRequestStatus pending, Pageable pageable);

    boolean existsByUserIdAndStatus(String userId, BadgeRequestStatus status);
}
