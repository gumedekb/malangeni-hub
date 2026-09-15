package co.za.malangeniblog.security;

import co.za.malangeniblog.repository.EventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component("eventSecurity")
public class EventSecurity {

    @Autowired
    private EventRepository eventRepository;

    public boolean isOrganiser(String eventId, String userId) {
        if (eventId == null || userId == null) {
            return false;
        }
        return eventRepository.findById(eventId)
                .map(event -> userId.equals(event.getOrganiserId()))
                .orElse(false);
    }
}
