package co.za.malangeniblog.controller;

import co.za.malangeniblog.dto.MapsLookupRequest;
import co.za.malangeniblog.dto.MapsLookupResult;
import co.za.malangeniblog.service.GoogleMapsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/maps")
public class MapsController {

    @Autowired
    private GoogleMapsService googleMapsService;

    /** Hub team: what a pasted Google Maps link says about a place (name, pin, address, hours). */
    @PostMapping("/lookup")
    @PreAuthorize("hasAnyRole('ADMIN','MODERATOR')")
    public ResponseEntity<MapsLookupResult> lookup(@RequestBody MapsLookupRequest request) {
        return ResponseEntity.ok(googleMapsService.lookup(request == null ? null : request.url()));
    }
}
