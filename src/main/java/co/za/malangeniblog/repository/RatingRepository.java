package co.za.malangeniblog.repository;

import co.za.malangeniblog.domain.Rating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RatingRepository extends JpaRepository<Rating, String> {
    List<Rating> findByAttractionId(String attractionId);

    Optional<Rating> findByAttractionIdAndUserId(String attractionId, String userId);

    long countByAttractionId(String attractionId);

    /** Used when a place is deleted; the caller runs in a transaction. */
    void deleteByAttractionId(String attractionId);

    @Query("select avg(r.score) from Rating r where r.attractionId = :attractionId")
    Double findAverageScoreByAttractionId(@Param("attractionId") String attractionId);
}
