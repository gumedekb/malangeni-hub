package co.za.malangeniblog.service;

import co.za.malangeniblog.domain.ApprovalStatus;
import co.za.malangeniblog.domain.LocalService;
import co.za.malangeniblog.domain.ServiceCategory;
import co.za.malangeniblog.domain.User;
import co.za.malangeniblog.exception.BadRequestException;
import co.za.malangeniblog.exception.ResourceNotFoundException;
import co.za.malangeniblog.repository.LocalServiceRepository;
import co.za.malangeniblog.repository.UserRepository;
import co.za.malangeniblog.security.SecurityUtil;
import co.za.malangeniblog.util.IdGenerator;
import co.za.malangeniblog.util.RepositoryValidationHelper;
import co.za.malangeniblog.util.ValidationUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Member-listed services with hub-team approval - the same two layers as events: required,
 * format-checked fields here and in the form; anything a form can't judge goes back to the
 * provider as NEEDS_CHANGES with a note.
 */
@Service
public class LocalServiceService {

    private static final int MIN_DESCRIPTION = 5;
    private static final int MAX_DESCRIPTION = 1000;
    private static final int MAX_NOTE = 1000;

    @Autowired
    private LocalServiceRepository localServiceRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ImageStorageService imageStorageService;

    public LocalService createService(LocalService input) {
        String userId = SecurityUtil.requireCurrentUserId();
        requireNotBanned(userId);

        LocalService service = new LocalService();
        service.setId(IdGenerator.generateId());
        applyEditableFields(service, input);
        validate(service);
        service.setProviderId(userId);
        service.setCreatedAt(LocalDateTime.now());
        // The hub team's own listings need no second pair of eyes.
        if (SecurityUtil.isCurrentUserStaff()) {
            markReviewed(service, ApprovalStatus.APPROVED, userId, null);
        } else {
            service.setStatus(ApprovalStatus.PENDING);
        }
        return localServiceRepository.save(service);
    }

    /** Approved listings are public; others only to their provider and the hub team. */
    public Optional<LocalService> getServiceById(String id) {
        RepositoryValidationHelper.validateNotEmpty(id, "Service ID");
        return localServiceRepository.findById(id).filter(this::canView);
    }

    public Page<LocalService> listApproved(ServiceCategory category, Pageable pageable) {
        return category == null
                ? localServiceRepository.findByStatusOrderByNameAsc(ApprovalStatus.APPROVED, pageable)
                : localServiceRepository.findByStatusAndServiceCategoryOrderByNameAsc(
                        ApprovalStatus.APPROVED, category, pageable);
    }

    public List<LocalService> getMyServices(String userId) {
        return localServiceRepository.findByProviderIdOrderByCreatedAtDesc(userId);
    }

    public Page<LocalService> getForReview(ApprovalStatus status, Pageable pageable) {
        return localServiceRepository.findByStatusOrderByCreatedAtAsc(status, pageable);
    }

    /** Provider or hub team. A provider's edit sends it back for approval. */
    public LocalService updateService(String id, LocalService input) {
        LocalService existing = find(id);
        boolean staff = SecurityUtil.isCurrentUserStaff();
        if (!staff) {
            requireNotBanned(SecurityUtil.requireCurrentUserId());
        }
        applyEditableFields(existing, input);
        validate(existing);
        if (!staff) {
            existing.setStatus(ApprovalStatus.PENDING);
        }
        return localServiceRepository.save(existing);
    }

    public LocalService approve(String id, String note) {
        LocalService service = find(id);
        if (service.getStatus() == ApprovalStatus.APPROVED) {
            throw new BadRequestException("This service is already approved");
        }
        markReviewed(service, ApprovalStatus.APPROVED, SecurityUtil.requireCurrentUserId(), note);
        return localServiceRepository.save(service);
    }

    /** Sends the listing back to its provider (hidden again if it was public). */
    public LocalService requestChanges(String id, String note) {
        LocalService service = find(id);
        markReviewed(service, ApprovalStatus.NEEDS_CHANGES, SecurityUtil.requireCurrentUserId(), note);
        return localServiceRepository.save(service);
    }

    public LocalService uploadImage(String id, MultipartFile file) {
        LocalService service = find(id);
        service.setImageUrl(imageStorageService.uploadServiceImage(id, file));
        if (!SecurityUtil.isCurrentUserStaff()) {
            service.setStatus(ApprovalStatus.PENDING);
        }
        return localServiceRepository.save(service);
    }

    public void deleteService(String id) {
        LocalService service = find(id);
        localServiceRepository.deleteById(id);
        if (service.getImageUrl() != null) {
            imageStorageService.deleteServiceImage(id);
        }
    }

    private LocalService find(String id) {
        RepositoryValidationHelper.validateNotEmpty(id, "Service ID");
        return localServiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service not found with id: " + id));
    }

    private boolean canView(LocalService service) {
        if (service.getStatus() == ApprovalStatus.APPROVED) {
            return true;
        }
        return SecurityUtil.getCurrentUserId()
                .map(userId -> userId.equals(service.getProviderId()) || SecurityUtil.isCurrentUserStaff())
                .orElse(false);
    }

    private void markReviewed(LocalService service, ApprovalStatus status, String reviewerId, String note) {
        ValidationUtil.validateMaxLength(note, MAX_NOTE, "Note");
        service.setStatus(status);
        service.setReviewedByUserId(reviewerId);
        service.setReviewedAt(LocalDateTime.now());
        service.setReviewNote(RepositoryValidationHelper.isNullOrEmpty(note) ? null : note.trim());
    }

    /** Client-editable fields only; status, provider, picture and review data are server-owned. */
    private void applyEditableFields(LocalService target, LocalService input) {
        if (input.getName() != null) {
            target.setName(input.getName().trim());
        }
        if (input.getServiceCategory() != null) {
            target.setServiceCategory(input.getServiceCategory());
        }
        if (input.getDescription() != null) {
            target.setDescription(input.getDescription().trim());
        }
        if (input.getContactNumber() != null) {
            target.setContactNumber(input.getContactNumber());
        }
        if (input.getAreaServed() != null) {
            target.setAreaServed(input.getAreaServed().trim());
        }
        // Optional: an empty string clears it.
        if (input.getOperatingHours() != null) {
            String hours = input.getOperatingHours().trim();
            target.setOperatingHours(hours.isEmpty() ? null : hours);
        }
    }

    /** Layer 1 on the server: required fields, in a usable format. Same rules as the form. */
    private void validate(LocalService service) {
        RepositoryValidationHelper.validateNotEmpty(service.getName(), "Name");
        ValidationUtil.validateMaxLength(service.getName(), ValidationUtil.MAX_SHORT_TEXT, "Name");
        if (service.getServiceCategory() == null) {
            throw new BadRequestException("Category is required");
        }
        String description = service.getDescription() == null ? "" : service.getDescription().trim();
        if (description.length() < MIN_DESCRIPTION) {
            throw new BadRequestException("Description must be at least " + MIN_DESCRIPTION + " characters");
        }
        ValidationUtil.validateMaxLength(description, MAX_DESCRIPTION, "Description");
        service.setContactNumber(ValidationUtil.requireSaCellphone(service.getContactNumber(), "Contact number"));
        RepositoryValidationHelper.validateNotEmpty(service.getAreaServed(), "Area served");
        ValidationUtil.validateMaxLength(service.getAreaServed(), ValidationUtil.MAX_SHORT_TEXT, "Area served");
        ValidationUtil.validateMaxLength(service.getOperatingHours(), ValidationUtil.MAX_SHORT_TEXT, "Operating hours");
    }

    /** Same rule as posts, news and events. */
    private void requireNotBanned(String userId) {
        userRepository.findById(userId)
                .filter(User::isBannedFromPosting)
                .ifPresent(banned -> {
                    throw new BadRequestException(banned.getBanReason() == null
                            ? "You are currently banned from posting"
                            : "You are currently banned from posting: " + banned.getBanReason());
                });
    }
}
