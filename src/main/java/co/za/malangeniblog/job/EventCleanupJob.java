package co.za.malangeniblog.job;

import co.za.malangeniblog.service.EventService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Deletes events once their date has passed.
 *
 * <p>Housekeeping only: every public query already hides past events, so nothing depends on
 * this running on time. That matters on Cloud Run, which scales to zero - the job simply catches
 * up on the next wake.
 */
@Component
public class EventCleanupJob {

    private static final Logger log = LoggerFactory.getLogger(EventCleanupJob.class);

    @Autowired
    private EventService eventService;

    @Scheduled(initialDelay = 60_000, fixedDelay = 3_600_000)
    public void removePastEvents() {
        try {
            int removed = eventService.deletePastEvents();
            if (removed > 0) {
                log.info("Removed {} past event(s)", removed);
            }
        } catch (RuntimeException ex) {
            // Never let housekeeping take the scheduler thread down; try again next hour.
            log.warn("Past-event cleanup failed", ex);
        }
    }
}
