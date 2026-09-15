package co.za.malangeniblog.repository;

import co.za.malangeniblog.domain.Event;
import co.za.malangeniblog.domain.EventStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, String> {
    /** Public list: approved events from today onwards, soonest first. */
    Page<Event> findByStatusAndStartAtGreaterThanEqualOrderByStartAtAsc(
            EventStatus status, LocalDateTime since, Pageable pageable);

    /** Staff queue, oldest submission first so nobody waits indefinitely. */
    Page<Event> findByStatusAndStartAtGreaterThanEqualOrderByCreatedAtAsc(
            EventStatus status, LocalDateTime since, Pageable pageable);

    List<Event> findByOrganiserIdAndStartAtGreaterThanEqualOrderByStartAtAsc(
            String organiserId, LocalDateTime since);

    List<Event> findByStartAtBefore(LocalDateTime cutoff);
}
