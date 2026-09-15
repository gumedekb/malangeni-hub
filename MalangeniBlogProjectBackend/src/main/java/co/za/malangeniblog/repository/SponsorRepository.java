package co.za.malangeniblog.repository;

import co.za.malangeniblog.domain.Sponsor;
import co.za.malangeniblog.domain.SponsorPlacement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SponsorRepository extends JpaRepository<Sponsor, String> {

    @Query("""
            select s from Sponsor s
            where s.placement = :placement
              and s.active = true
              and (s.startAt is null or s.startAt <= :now)
              and (s.endAt is null or s.endAt >= :now)
            """)
    List<Sponsor> findCurrentlyActiveByPlacement(@Param("placement") SponsorPlacement placement,
                                                  @Param("now") LocalDateTime now);
}
