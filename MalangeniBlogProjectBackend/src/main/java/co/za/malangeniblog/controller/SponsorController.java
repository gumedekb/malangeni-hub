package co.za.malangeniblog.controller;

import co.za.malangeniblog.domain.Sponsor;
import co.za.malangeniblog.domain.SponsorPlacement;
import co.za.malangeniblog.service.SponsorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/sponsors")
public class SponsorController {

    @Autowired
    private SponsorService sponsorService;

    // Public: the one ad slot a page renders. 204 when nothing is booked for the placement,
    // so the frontend can simply hide the strip.
    @GetMapping("/active")
    public ResponseEntity<Sponsor> getActiveSponsor(@RequestParam SponsorPlacement placement) {
        Optional<Sponsor> sponsor = sponsorService.getActiveSponsor(placement);
        return sponsor.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MODERATOR')")
    public ResponseEntity<Sponsor> createSponsor(@RequestBody Sponsor sponsor) {
        return ResponseEntity.status(HttpStatus.CREATED).body(sponsorService.createSponsor(sponsor));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MODERATOR')")
    public ResponseEntity<Sponsor> getSponsorById(@PathVariable String id) {
        Optional<Sponsor> sponsor = sponsorService.getSponsorById(id);
        return sponsor.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MODERATOR')")
    public ResponseEntity<Page<Sponsor>> getAllSponsors(@PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(sponsorService.getAllSponsors(pageable));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MODERATOR')")
    public ResponseEntity<Sponsor> updateSponsor(@PathVariable String id, @RequestBody Sponsor sponsor) {
        return ResponseEntity.ok(sponsorService.updateSponsor(id, sponsor));
    }

    @PutMapping("/{id}/active")
    @PreAuthorize("hasAnyRole('ADMIN','MODERATOR')")
    public ResponseEntity<Sponsor> setActive(@PathVariable String id, @RequestParam boolean active) {
        return ResponseEntity.ok(sponsorService.setActive(id, active));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MODERATOR')")
    public ResponseEntity<Void> deleteSponsor(@PathVariable String id) {
        sponsorService.deleteSponsor(id);
        return ResponseEntity.noContent().build();
    }
}
