package co.za.malangeniblog.service;

import co.za.malangeniblog.domain.BadgeRequestStatus;
import co.za.malangeniblog.domain.PublicUserSerializer;
import co.za.malangeniblog.domain.Role;
import co.za.malangeniblog.domain.User;
import co.za.malangeniblog.dto.BadgeRequestInput;
import co.za.malangeniblog.dto.OnboardingRequest;
import co.za.malangeniblog.exception.BadRequestException;
import co.za.malangeniblog.exception.ConflictException;
import co.za.malangeniblog.repository.UserRepository;
import co.za.malangeniblog.security.SecurityUtil;
import co.za.malangeniblog.util.RepositoryValidationHelper;
import co.za.malangeniblog.util.ValidationUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Accounts are only ever created by Google sign-in (FirebaseUserService) - there is no
 * admin-created account and no local password any more (TASKS.md 11.9).
 */
@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BadgeRequestService badgeRequestService;

    public Optional<User> getUserById(String id) {
        RepositoryValidationHelper.validateNotEmpty(id, "User ID");
        return userRepository.findById(id);
    }

    public Optional<User> getUserByUsername(String username) {
        if (RepositoryValidationHelper.isNullOrEmpty(username)) {
            return Optional.empty();
        }
        return userRepository.findByUsername(username);
    }

    public Optional<User> getUserByEmail(String email) {
        if (RepositoryValidationHelper.isNullOrEmpty(email)) {
            return Optional.empty();
        }
        return userRepository.findByEmail(email);
    }

    /** Every account, or only those holding one of {@code roles} (the Team tab asks for ADMIN, MODERATOR). */
    public Page<User> getAllUsers(List<Role> roles, Pageable pageable) {
        return roles == null || roles.isEmpty()
                ? userRepository.findAll(pageable)
                : userRepository.findByRoleIn(roles, pageable);
    }

    /** Up to 10 accounts whose username, Google name or email contains the term (2+ characters). */
    public List<User> searchUsers(String query) {
        String term = query == null ? "" : query.trim();
        if (term.length() < 2) {
            throw new BadRequestException("Type at least 2 characters to search");
        }
        return userRepository
                .findTop10ByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrDisplayNameContainingIgnoreCaseOrderByUsernameAsc(
                        term, term, term);
    }

    /**
     * The newest members (public projection, backstage staff left out) and how many joined in
     * the last seven days, for the community sidebar.
     */
    public Map<String, Object> recentMembers(int size) {
        int limit = Math.max(1, Math.min(size, 20));
        List<Map<String, Object>> members = userRepository
                .findByBackstageFalseOrderByCreatedAtDesc(PageRequest.of(0, limit))
                .stream()
                .map(PublicUserSerializer::toPublicMap)
                .toList();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("members", members);
        body.put("joinedThisWeek",
                userRepository.countByBackstageFalseAndCreatedAtAfter(LocalDateTime.now().minusDays(7)));
        return body;
    }

    /** Admin edit of username/email. Role has its own endpoint so a change is always explicit. */
    public User updateUser(String id, User user) {
        RepositoryValidationHelper.validateNotEmpty(id, "User ID");
        validateProfile(user.getUsername(), user.getEmail());
        return userRepository.findById(id)
                .map(existing -> {
                    if (!RepositoryValidationHelper.isNullOrEmpty(user.getUsername())) {
                        existing.setUsername(user.getUsername());
                    }
                    if (!RepositoryValidationHelper.isNullOrEmpty(user.getEmail())) {
                        existing.setEmail(user.getEmail());
                    }
                    return userRepository.save(existing);
                })
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));
    }

    /**
     * The first-sign-in question: member, or formal/informal business owner. Answered once.
     * Choosing a business requires the business details, which go straight onto the
     * verification list - the choice itself grants nothing until staff approve it.
     */
    @Transactional
    public User completeOnboarding(String id, OnboardingRequest request) {
        if (request == null || request.getAccountType() == null) {
            throw new BadRequestException("Account type is required");
        }
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));
        if (user.getAccountType() != null) {
            throw new ConflictException("Account type has already been chosen");
        }
        user.setAccountType(request.getAccountType());
        userRepository.save(user);

        if (request.getAccountType().isBusiness()) {
            BadgeRequestInput business = request.getBusiness();
            if (business == null) {
                throw new BadRequestException("Business details are required for a business account");
            }
            if (business.getBusinessType() == null) {
                business.setBusinessType(request.getAccountType().toBusinessType());
            }
            badgeRequestService.submit(id, business);
        }
        return user;
    }

    /**
     * Applies or lifts a posting ban. Admins and moderators may call this.
     *
     * <p>Admins cannot be banned: a moderator banning an admin would be a privilege inversion,
     * and an admin banning another admin is a fight this code should not enable.
     */
    public User setPostingBan(String id, boolean banned, String reason) {
        RepositoryValidationHelper.validateNotEmpty(id, "User ID");
        return userRepository.findById(id)
                .map(existing -> {
                    if (banned && existing.getRole() == Role.ADMIN) {
                        throw new BadRequestException("Administrators cannot be banned from posting");
                    }
                    if (banned && id.equals(SecurityUtil.getCurrentUserId().orElse(null))) {
                        throw new BadRequestException("You cannot ban yourself");
                    }
                    existing.setBannedFromPosting(banned);
                    existing.setBanReason(banned ? reason : null);
                    existing.setBannedAt(banned ? LocalDateTime.now() : null);
                    return userRepository.save(existing);
                })
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));
    }

    /**
     * Sets the avatar URL. Package-visible intent: only called with a URL this backend got back
     * from Cloudinary, never with one supplied by the caller.
     */
    public User updateProfileImage(String id, String url) {
        RepositoryValidationHelper.validateNotEmpty(id, "User ID");
        return userRepository.findById(id)
                .map(existing -> {
                    existing.setProfileImageUrl(url);
                    return userRepository.save(existing);
                })
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));
    }

    /**
     * Admin-only: make someone a moderator or take it away. ADMIN is never granted or removed
     * here - app.admin-emails is the only source of admins and would undo it on next sign-in.
     * BUSINESS_OWNER comes from approving a badge request.
     */
    public User updateRole(String id, Role role) {
        RepositoryValidationHelper.validateNotEmpty(id, "User ID");
        if (role == null) {
            throw new BadRequestException("Role is required");
        }
        if (role == Role.ADMIN) {
            throw new BadRequestException("Admins are set in configuration (app.admin-emails), not through the API");
        }
        return userRepository.findById(id)
                .map(existing -> {
                    if (existing.getRole() == Role.ADMIN) {
                        throw new BadRequestException("Administrator roles are managed in configuration");
                    }
                    if (role == Role.BUSINESS_OWNER
                            && existing.getBadgeRequestStatus() != BadgeRequestStatus.APPROVED) {
                        throw new BadRequestException("Business owner is granted by approving a badge request");
                    }
                    existing.setRole(role);
                    return userRepository.save(existing);
                })
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));
    }

    /** Only checks values that were supplied, so partial updates stay possible. */
    private void validateProfile(String username, String email) {
        ValidationUtil.validateMaxLength(username, ValidationUtil.MAX_SHORT_TEXT, "Username");
        ValidationUtil.validateOptionalEmail(email, "Email");
        ValidationUtil.validateMaxLength(email, ValidationUtil.MAX_SHORT_TEXT, "Email");
    }

    // Deleting an account lives in AccountDeletionService: it has to take the member's content with it.
}
