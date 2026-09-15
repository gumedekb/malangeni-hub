package co.za.malangeniblog;

import co.za.malangeniblog.service.EventService;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.TimeZone;

@SpringBootApplication
@EnableScheduling // EventCleanupJob
public class Main {
    public static void main(String[] args) {
        // Timestamps are LocalDateTime (no zone): the frontend and EventService read them as South
        // African time, so "now" must be SA time too. Containers default to UTC, which made every
        // new post look two hours old.
        TimeZone.setDefault(TimeZone.getTimeZone(EventService.ZONE));
        SpringApplication.run(Main.class, args);
    }
}
