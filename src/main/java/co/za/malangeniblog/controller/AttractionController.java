package co.za.malangeniblog.controller;

import co.za.malangeniblog.domain.Attraction;
import co.za.malangeniblog.service.AttractionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/attractions")
public class AttractionController {

    @Autowired
    private AttractionService attractionService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MODERATOR')")
    public ResponseEntity<Attraction> createAttraction(@RequestBody Attraction attraction) {
        return ResponseEntity.status(HttpStatus.CREATED).body(attractionService.createAttraction(attraction));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Attraction> getAttractionById(@PathVariable String id) {
        Optional<Attraction> attraction = attractionService.getAttractionById(id);
        return attraction.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<List<Attraction>> getAttractionsByCategory(@PathVariable String categoryId) {
        return ResponseEntity.ok(attractionService.getAttractionsByCategory(categoryId));
    }

    @GetMapping("/search/location")
    public ResponseEntity<List<Attraction>> searchByLocation(@RequestParam String location) {
        return ResponseEntity.ok(attractionService.searchByLocation(location));
    }

    @GetMapping("/search/name")
    public ResponseEntity<List<Attraction>> searchByName(@RequestParam String name) {
        return ResponseEntity.ok(attractionService.searchByName(name));
    }

    @GetMapping
    public ResponseEntity<Page<Attraction>> getAllAttractions(@PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(attractionService.getAllAttractions(pageable));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MODERATOR')")
    public ResponseEntity<Attraction> updateAttraction(@PathVariable String id, @RequestBody Attraction attraction) {
        return ResponseEntity.ok(attractionService.updateAttraction(id, attraction));
    }

    /** A place's picture (multipart field {@code file}), replacing any previous one. Hub team only. */
    @PostMapping(value = "/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','MODERATOR')")
    public ResponseEntity<Attraction> uploadImage(@PathVariable String id, @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(attractionService.uploadImage(id, file));
    }

    @DeleteMapping("/{id}/image")
    @PreAuthorize("hasAnyRole('ADMIN','MODERATOR')")
    public ResponseEntity<Attraction> removeImage(@PathVariable String id) {
        return ResponseEntity.ok(attractionService.removeImage(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MODERATOR')")
    public ResponseEntity<Void> deleteAttraction(@PathVariable String id) {
        attractionService.deleteAttraction(id);
        return ResponseEntity.noContent().build();
    }
}
