package co.za.malangeniblog.controller;

import co.za.malangeniblog.domain.ApprovalStatus;
import co.za.malangeniblog.domain.LocalService;
import co.za.malangeniblog.domain.ServiceCategory;
import co.za.malangeniblog.dto.ReviewNoteRequest;
import co.za.malangeniblog.security.SecurityUtil;
import co.za.malangeniblog.service.LocalServiceService;
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

/** Services members offer, approved by the hub team - same flow as events. */
@RestController
@RequestMapping("/api/services")
public class LocalServiceController {

    private static final String STAFF_OR_PROVIDER =
            "hasAnyRole('ADMIN','MODERATOR') or @serviceSecurity.isProvider(#id, authentication.principal.id)";

    @Autowired
    private LocalServiceService localServiceService;

    /** Any signed-in member. Starts PENDING unless the submitter is on the hub team. */
    @PostMapping
    public ResponseEntity<LocalService> createService(@RequestBody LocalService service) {
        return ResponseEntity.status(HttpStatus.CREATED).body(localServiceService.createService(service));
    }

    @GetMapping("/{id}")
    public ResponseEntity<LocalService> getServiceById(@PathVariable String id) {
        Optional<LocalService> service = localServiceService.getServiceById(id);
        return service.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    /** Public directory: approved listings only, optionally one category. */
    @GetMapping
    public ResponseEntity<Page<LocalService>> listServices(
            @RequestParam(required = false) ServiceCategory category,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(localServiceService.listApproved(category, pageable));
    }

    /** The caller's own listings, in every status. */
    @GetMapping("/mine")
    public ResponseEntity<List<LocalService>> getMyServices() {
        return ResponseEntity.ok(localServiceService.getMyServices(SecurityUtil.requireCurrentUserId()));
    }

    /** Hub-team approval queue. */
    @GetMapping("/review")
    @PreAuthorize("hasAnyRole('ADMIN','MODERATOR')")
    public ResponseEntity<Page<LocalService>> getForReview(
            @RequestParam(defaultValue = "PENDING") ApprovalStatus status,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(localServiceService.getForReview(status, pageable));
    }

    @PutMapping("/{id}")
    @PreAuthorize(STAFF_OR_PROVIDER)
    public ResponseEntity<LocalService> updateService(@PathVariable String id, @RequestBody LocalService service) {
        return ResponseEntity.ok(localServiceService.updateService(id, service));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN','MODERATOR')")
    public ResponseEntity<LocalService> approve(@PathVariable String id,
                                                @RequestBody(required = false) ReviewNoteRequest body) {
        return ResponseEntity.ok(localServiceService.approve(id, body == null ? null : body.getNote()));
    }

    @PostMapping("/{id}/needs-changes")
    @PreAuthorize("hasAnyRole('ADMIN','MODERATOR')")
    public ResponseEntity<LocalService> requestChanges(@PathVariable String id,
                                                       @RequestBody(required = false) ReviewNoteRequest body) {
        return ResponseEntity.ok(localServiceService.requestChanges(id, body == null ? null : body.getNote()));
    }

    /** Optional picture (multipart field {@code file}). */
    @PostMapping(value = "/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize(STAFF_OR_PROVIDER)
    public ResponseEntity<LocalService> uploadImage(@PathVariable String id, @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(localServiceService.uploadImage(id, file));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize(STAFF_OR_PROVIDER)
    public ResponseEntity<Void> deleteService(@PathVariable String id) {
        localServiceService.deleteService(id);
        return ResponseEntity.noContent().build();
    }
}
