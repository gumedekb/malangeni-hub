package co.za.malangeniblog.controller;

import co.za.malangeniblog.domain.BadgeRequest;
import co.za.malangeniblog.domain.BadgeRequestStatus;
import co.za.malangeniblog.dto.BadgeRequestInput;
import co.za.malangeniblog.dto.ReviewNoteRequest;
import co.za.malangeniblog.security.SecurityUtil;
import co.za.malangeniblog.service.BadgeRequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/badge-requests")
public class BadgeRequestController {

    @Autowired
    private BadgeRequestService badgeRequestService;

    /** A member asks for the business badge. 409 if one is already waiting. */
    @PostMapping
    public ResponseEntity<BadgeRequest> submit(@RequestBody BadgeRequestInput input) {
        String userId = SecurityUtil.requireCurrentUserId();
        return ResponseEntity.status(HttpStatus.CREATED).body(badgeRequestService.submit(userId, input));
    }

    @GetMapping("/mine")
    public ResponseEntity<List<BadgeRequest>> mine() {
        return ResponseEntity.ok(badgeRequestService.getForUser(SecurityUtil.requireCurrentUserId()));
    }

    /** The verification list. Defaults to requests still waiting for a decision. */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MODERATOR')")
    public ResponseEntity<Page<BadgeRequest>> list(
            @RequestParam(defaultValue = "PENDING") BadgeRequestStatus status,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(badgeRequestService.getByStatus(status, pageable));
    }

    /** Verification log: every approve/reject with who decided it, newest first. */
    @GetMapping("/log")
    @PreAuthorize("hasAnyRole('ADMIN','MODERATOR')")
    public ResponseEntity<Page<BadgeRequest>> log(@PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(badgeRequestService.getDecisionLog(pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MODERATOR')")
    public ResponseEntity<BadgeRequest> getById(@PathVariable String id) {
        return ResponseEntity.ok(badgeRequestService.getById(id));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN','MODERATOR')")
    public ResponseEntity<BadgeRequest> approve(@PathVariable String id,
                                                @RequestBody(required = false) ReviewNoteRequest body) {
        return ResponseEntity.ok(badgeRequestService.approve(id, body == null ? null : body.getNote()));
    }

    /** Take a confirmed business badge away from a member (never an admin). */
    @PostMapping("/users/{userId}/revoke")
    @PreAuthorize("hasAnyRole('ADMIN','MODERATOR')")
    public ResponseEntity<BadgeRequest> revoke(@PathVariable String userId,
                                               @RequestBody(required = false) ReviewNoteRequest body) {
        return ResponseEntity.ok(badgeRequestService.revokeForUser(userId, body == null ? null : body.getNote()));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN','MODERATOR')")
    public ResponseEntity<BadgeRequest> reject(@PathVariable String id,
                                               @RequestBody(required = false) ReviewNoteRequest body) {
        return ResponseEntity.ok(badgeRequestService.reject(id, body == null ? null : body.getNote()));
    }
}
