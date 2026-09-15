package co.za.malangeniblog.controller;

import co.za.malangeniblog.domain.PublicUserSerializer;
import co.za.malangeniblog.domain.User;
import co.za.malangeniblog.dto.BanRequest;
import co.za.malangeniblog.dto.OnboardingRequest;
import co.za.malangeniblog.dto.UpdateRoleRequest;
import co.za.malangeniblog.security.SecurityUtil;
import co.za.malangeniblog.service.AccountDeletionService;
import co.za.malangeniblog.service.ImageStorageService;
import co.za.malangeniblog.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private ImageStorageService imageStorageService;

    @Autowired
    private AccountDeletionService accountDeletionService;

    // No POST /api/users: accounts are created only by Google sign-in (TASKS.md 11.9).

    /** First-sign-in choice: member or formal/informal business owner. 409 if already answered. */
    @PostMapping("/me/onboarding")
    public ResponseEntity<User> completeOnboarding(@RequestBody OnboardingRequest request) {
        return ResponseEntity.ok(userService.completeOnboarding(SecurityUtil.requireCurrentUserId(), request));
    }

    /** Newest members for the community sidebar (members only), plus how many joined this week. */
    @GetMapping("/recent")
    public ResponseEntity<Map<String, Object>> recentMembers(@RequestParam(defaultValue = "8") int size) {
        return ResponseEntity.ok(userService.recentMembers(size));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or #id == authentication.principal.id")
    public ResponseEntity<User> getUserById(@PathVariable String id) {
        Optional<User> user = userService.getUserById(id);
        return user.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    /** Another member's public profile (members only) - the same whitelist used for post authors. */
    @GetMapping("/profile/{username}")
    public ResponseEntity<Map<String, Object>> getPublicProfile(@PathVariable String username) {
        return userService.getUserByUsername(username)
                .map(user -> ResponseEntity.ok(PublicUserSerializer.toPublicMap(user)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/username/{username}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> getUserByUsername(@PathVariable String username) {
        Optional<User> user = userService.getUserByUsername(username);
        return user.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/email/{email}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> getUserByEmail(@PathVariable String email) {
        Optional<User> user = userService.getUserByEmail(email);
        return user.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<User>> getAllUsers(@PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(userService.getAllUsers(pageable));
    }

    // No self-service username change on purpose (product decision 2026-08-01): a stable handle
    // is what lets moderators identify a repeat offender. Members change only their picture.
    // Admins can still rename someone via PUT /{id}.

    /**
     * Uploads a new profile picture and stores the resulting URL in one call.
     *
     * <p>Multipart rather than a JSON URL: accepting a caller-supplied URL would let a member
     * point their avatar at any address on the internet.
     */
    @PostMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<User> uploadOwnAvatar(@RequestParam("file") MultipartFile file) {
        String id = SecurityUtil.requireCurrentUserId();
        String url = imageStorageService.uploadAvatar(id, file);
        return ResponseEntity.ok(userService.updateProfileImage(id, url));
    }

    /** Removes the profile picture, both the stored file and the URL on the account. */
    @DeleteMapping("/me/avatar")
    public ResponseEntity<User> deleteOwnAvatar() {
        String id = SecurityUtil.requireCurrentUserId();
        imageStorageService.deleteAvatar(id);
        return ResponseEntity.ok(userService.updateProfileImage(id, null));
    }

    @PostMapping("/{id}/ban")
    @PreAuthorize("hasAnyRole('ADMIN','MODERATOR')")
    public ResponseEntity<User> banFromPosting(@PathVariable String id, @RequestBody(required = false) BanRequest request) {
        String reason = request == null ? null : request.getReason();
        return ResponseEntity.ok(userService.setPostingBan(id, true, reason));
    }

    @PostMapping("/{id}/unban")
    @PreAuthorize("hasAnyRole('ADMIN','MODERATOR')")
    public ResponseEntity<User> unbanFromPosting(@PathVariable String id) {
        return ResponseEntity.ok(userService.setPostingBan(id, false, null));
    }

    @PutMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> updateRole(@PathVariable String id, @RequestBody UpdateRoleRequest request) {
        return ResponseEntity.ok(userService.updateRole(id, request.getRole()));
    }

    /**
     * Admin-only now. Members edit themselves through {@code PUT /me}, which cannot touch email,
     * role or firebaseUid.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> updateUser(@PathVariable String id, @RequestBody User user) {
        return ResponseEntity.ok(userService.updateUser(id, user));
    }

    /** Deletes the account and everything the member posted. Self, or an admin; never an admin. */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or #id == authentication.principal.id")
    public ResponseEntity<Void> deleteUser(@PathVariable String id) {
        accountDeletionService.deleteAccount(id);
        return ResponseEntity.noContent().build();
    }
}
