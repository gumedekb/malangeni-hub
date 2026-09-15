package co.za.malangeniblog.security;

import co.za.malangeniblog.repository.LocalServiceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component("serviceSecurity")
public class ServiceSecurity {

    @Autowired
    private LocalServiceRepository localServiceRepository;

    public boolean isProvider(String serviceId, String userId) {
        if (serviceId == null || userId == null) {
            return false;
        }
        return localServiceRepository.findById(serviceId)
                .map(service -> userId.equals(service.getProviderId()))
                .orElse(false);
    }
}
