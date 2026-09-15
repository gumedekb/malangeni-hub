package co.za.malangeniblog.service;

import co.za.malangeniblog.domain.*;
import co.za.malangeniblog.dto.BadgeRequestInput;
import co.za.malangeniblog.exception.BadRequestException;
import co.za.malangeniblog.exception.ConflictException;
import co.za.malangeniblog.exception.ResourceNotFoundException;
import co.za.malangeniblog.repository.BadgeRequestRepository;
import co.za.malangeniblog.repository.ShopRepository;
import co.za.malangeniblog.repository.UserRepository;
import co.za.malangeniblog.security.SecurityUtil;
import co.za.malangeniblog.util.IdGenerator;
import co.za.malangeniblog.util.RepositoryValidationHelper;
import co.za.malangeniblog.util.ValidationUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Business verification: members ask, staff (admins/moderators) confirm or reject.
 * Approval is what grants the BUSINESS badge and the BUSINESS_OWNER role.
 */
@Service
public class BadgeRequestService {

    private static final int MAX_DESCRIPTION = 1000;

    @Autowired
    private BadgeRequestRepository badgeRequestRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ShopRepository shopRepository;

    @Transactional
    public BadgeRequest submit(String userId, BadgeRequestInput input) {
        if (input == null) {
            throw new BadRequestException("Business details are required");
        }
        User user = findUser(userId);
        if (user.getBadgeRequestStatus() == BadgeRequestStatus.APPROVED) {
            throw new BadRequestException("Your business is already confirmed");
        }
        if (badgeRequestRepository.existsByUserIdAndStatus(userId, BadgeRequestStatus.PENDING)) {
            throw new ConflictException("You already have a request waiting to be reviewed");
        }
        validate(input);

        BadgeRequest request = new BadgeRequest();
        request.setId(IdGenerator.generateId());
        request.setUserId(userId);
        BusinessType type = input.getBusinessType();
        if (type == null && user.getAccountType() != null) {
            type = user.getAccountType().toBusinessType();
        }
        request.setBusinessType(type);
        request.setBusinessName(input.getBusinessName().trim());
        request.setCategory(trimToNull(input.getCategory()));
        request.setLocation(trimToNull(input.getLocation()));
        request.setContactNumber(trimToNull(input.getContactNumber()));
        request.setRegistrationNumber(trimToNull(input.getRegistrationNumber()));
        request.setDescription(trimToNull(input.getDescription()));
        request.setStatus(BadgeRequestStatus.PENDING);
        request.setCreatedAt(LocalDateTime.now());

        user.setBadgeRequestStatus(BadgeRequestStatus.PENDING);
        userRepository.save(user);
        return badgeRequestRepository.save(request);
    }

    public List<BadgeRequest> getForUser(String userId) {
        return badgeRequestRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    /** The verification queue, oldest first so nobody waits indefinitely. */
    public Page<BadgeRequest> getByStatus(BadgeRequestStatus status, Pageable pageable) {
        return badgeRequestRepository.findByStatusOrderByCreatedAtAsc(status, pageable);
    }

    /** Who verified or rejected whom, newest decision first. */
    public Page<BadgeRequest> getDecisionLog(Pageable pageable) {
        return badgeRequestRepository.findDecisionLog(BadgeRequestStatus.PENDING, pageable);
    }

    /**
     * Takes a confirmed business badge away. The approval stays on record next to the
     * revocation, the role drops back from BUSINESS_OWNER, and any directory listing is taken
     * down with it (listings are for confirmed businesses only). Admins' badges are not
     * touchable here - admins are managed in configuration.
     */
    @Transactional
    public BadgeRequest revokeForUser(String userId, String note) {
        User user = findUser(userId);
        if (user.getRole() == Role.ADMIN) {
            throw new BadRequestException("Administrators' badges are managed in configuration");
        }
        String staffId = SecurityUtil.requireCurrentUserId();
        if (staffId.equals(userId)) {
            throw new BadRequestException("You cannot revoke your own badge");
        }
        BadgeRequest request = badgeRequestRepository
                .findFirstByUserIdAndStatusOrderByReviewedAtDesc(userId, BadgeRequestStatus.APPROVED)
                .orElseThrow(() -> new BadRequestException("This member has no confirmed business to revoke"));
        ValidationUtil.validateMaxLength(note, MAX_DESCRIPTION, "Note");

        request.setStatus(BadgeRequestStatus.REVOKED);
        request.setRevokedByUserId(staffId);
        request.setRevokedAt(LocalDateTime.now());
        request.setRevokeNote(trimToNull(note));

        user.setBadgeRequestStatus(BadgeRequestStatus.REVOKED);
        if (user.getRole() == Role.BUSINESS_OWNER) {
            user.setRole(Role.USER);
        }
        userRepository.save(user);

        shopRepository.findByOwnerId(userId).forEach(shop -> {
            shop.setApproved(false);
            shopRepository.save(shop);
        });
        return badgeRequestRepository.save(request);
    }

    public BadgeRequest getById(String id) {
        return badgeRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Badge request not found with id: " + id));
    }

    @Transactional
    public BadgeRequest approve(String id, String note) {
        BadgeRequest request = startReview(id, note);
        request.setStatus(BadgeRequestStatus.APPROVED);

        User user = findUser(request.getUserId());
        user.setBadgeRequestStatus(BadgeRequestStatus.APPROVED);
        // Staff keep their staff role; the badge still shows next to it.
        if (user.getRole() == Role.USER) {
            user.setRole(Role.BUSINESS_OWNER);
        }
        if (request.getBusinessType() != null) {
            user.setAccountType(request.getBusinessType() == BusinessType.FORMAL
                    ? AccountType.BUSINESS_FORMAL : AccountType.BUSINESS_INFORMAL);
        }
        userRepository.save(user);
        return badgeRequestRepository.save(request);
    }

    @Transactional
    public BadgeRequest reject(String id, String note) {
        BadgeRequest request = startReview(id, note);
        request.setStatus(BadgeRequestStatus.REJECTED);

        User user = findUser(request.getUserId());
        user.setBadgeRequestStatus(BadgeRequestStatus.REJECTED);
        userRepository.save(user);
        return badgeRequestRepository.save(request);
    }

    private BadgeRequest startReview(String id, String note) {
        BadgeRequest request = getById(id);
        if (request.getStatus() != BadgeRequestStatus.PENDING) {
            throw new BadRequestException("This request has already been " + request.getStatus().name().toLowerCase());
        }
        String reviewerId = SecurityUtil.requireCurrentUserId();
        if (reviewerId.equals(request.getUserId())) {
            throw new BadRequestException("You cannot review your own request");
        }
        ValidationUtil.validateMaxLength(note, MAX_DESCRIPTION, "Note");
        request.setReviewedByUserId(reviewerId);
        request.setReviewedAt(LocalDateTime.now());
        request.setReviewNote(trimToNull(note));
        return request;
    }

    private void validate(BadgeRequestInput input) {
        RepositoryValidationHelper.validateNotEmpty(input.getBusinessName(), "Business name");
        ValidationUtil.validateMaxLength(input.getBusinessName(), ValidationUtil.MAX_SHORT_TEXT, "Business name");
        ValidationUtil.validateMaxLength(input.getCategory(), ValidationUtil.MAX_SHORT_TEXT, "Category");
        ValidationUtil.validateMaxLength(input.getLocation(), ValidationUtil.MAX_SHORT_TEXT, "Location");
        ValidationUtil.validateOptionalPhone(input.getContactNumber(), "Contact number");
        ValidationUtil.validateMaxLength(input.getRegistrationNumber(), ValidationUtil.MAX_SHORT_TEXT, "Registration number");
        ValidationUtil.validateMaxLength(input.getDescription(), MAX_DESCRIPTION, "Description");
    }

    private User findUser(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
    }

    private static String trimToNull(String value) {
        return RepositoryValidationHelper.isNullOrEmpty(value) ? null : value.trim();
    }
}
