package co.za.malangeniblog.service;

import co.za.malangeniblog.domain.BadgeRequestStatus;
import co.za.malangeniblog.domain.Shop;
import co.za.malangeniblog.exception.BadRequestException;
import co.za.malangeniblog.exception.ResourceNotFoundException;
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

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * The local business directory. Deliberately not a shop builder: products, ordering and
 * per-shop subdomain sites were removed on 2026-09-14.
 */
@Service
public class ShopService {

    @Autowired
    private ShopRepository shopRepository;

    @Autowired
    private UserRepository userRepository;

    public Shop createShop(Shop shop) {
        RepositoryValidationHelper.validateNotEmpty(shop.getName(), "Shop name");
        ValidationUtil.validateCoordinates(shop.getLatitude(), shop.getLongitude());
        validateContactFields(shop);
        String ownerId = SecurityUtil.requireCurrentUserId();
        // Only a business the hub team has confirmed may appear in the directory.
        boolean confirmedBusiness = userRepository.findById(ownerId)
                .map(user -> user.getBadgeRequestStatus() == BadgeRequestStatus.APPROVED)
                .orElse(false);
        if (!confirmedBusiness && !SecurityUtil.isCurrentUserStaff()) {
            throw new BadRequestException("Only confirmed businesses can be listed - request the business badge first");
        }
        shop.setId(IdGenerator.generateId());
        shop.setOwnerId(ownerId);
        // New listings start unapproved and must be reviewed before appearing publicly.
        shop.setApproved(false);
        shop.setActive(true);
        shop.setCreatedAt(LocalDateTime.now());
        return shopRepository.save(shop);
    }

    public Optional<Shop> getShopById(String id) {
        RepositoryValidationHelper.validateNotEmpty(id, "Shop ID");
        return shopRepository.findById(id).filter(this::canView);
    }

    public Page<Shop> listShops(String categoryId, Pageable pageable) {
        if (!RepositoryValidationHelper.isNullOrEmpty(categoryId)) {
            return shopRepository.findByApprovedTrueAndActiveTrueAndCategoryId(categoryId, pageable);
        }
        return shopRepository.findByApprovedTrueAndActiveTrue(pageable);
    }

    /** Staff: listings waiting for approval ({@code approved=false}) or already approved. */
    public Page<Shop> listForReview(boolean approved, Pageable pageable) {
        return shopRepository.findByApprovedOrderByCreatedAtAsc(approved, pageable);
    }

    public List<Shop> getMyShops(String ownerId) {
        RepositoryValidationHelper.validateNotEmpty(ownerId, "Owner ID");
        return shopRepository.findByOwnerId(ownerId);
    }

    public Shop updateShop(String id, Shop shop) {
        RepositoryValidationHelper.validateNotEmpty(id, "Shop ID");
        validateContactFields(shop);
        return shopRepository.findById(id)
                .map(existing -> {
                    if (!RepositoryValidationHelper.isNullOrEmpty(shop.getName())) {
                        existing.setName(shop.getName());
                    }
                    if (!RepositoryValidationHelper.isNullOrEmpty(shop.getDescription())) {
                        existing.setDescription(shop.getDescription());
                    }
                    if (!RepositoryValidationHelper.isNullOrEmpty(shop.getLogoUrl())) {
                        existing.setLogoUrl(shop.getLogoUrl());
                    }
                    if (!RepositoryValidationHelper.isNullOrEmpty(shop.getCategoryId())) {
                        existing.setCategoryId(shop.getCategoryId());
                    }
                    if (!RepositoryValidationHelper.isNullOrEmpty(shop.getPhone())) {
                        existing.setPhone(shop.getPhone());
                    }
                    if (!RepositoryValidationHelper.isNullOrEmpty(shop.getEmail())) {
                        existing.setEmail(shop.getEmail());
                    }
                    if (!RepositoryValidationHelper.isNullOrEmpty(shop.getAddress())) {
                        existing.setAddress(shop.getAddress());
                    }
                    // Validate against the pair the shop will end up with, so updating only one
                    // half of an already-pinned location stays valid but half-pinning does not.
                    String newLatitude = RepositoryValidationHelper.isNullOrEmpty(shop.getLatitude())
                            ? existing.getLatitude() : shop.getLatitude();
                    String newLongitude = RepositoryValidationHelper.isNullOrEmpty(shop.getLongitude())
                            ? existing.getLongitude() : shop.getLongitude();
                    ValidationUtil.validateCoordinates(newLatitude, newLongitude);
                    existing.setLatitude(newLatitude);
                    existing.setLongitude(newLongitude);
                    if (shop.getOpeningTime() != null) {
                        existing.setOpeningTime(shop.getOpeningTime());
                    }
                    if (shop.getClosingTime() != null) {
                        existing.setClosingTime(shop.getClosingTime());
                    }
                    return shopRepository.save(existing);
                })
                .orElseThrow(() -> new ResourceNotFoundException("Shop not found with id: " + id));
    }

    public Shop setActive(String id, boolean active) {
        RepositoryValidationHelper.validateNotEmpty(id, "Shop ID");
        Shop shop = shopRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Shop not found with id: " + id));
        shop.setActive(active);
        return shopRepository.save(shop);
    }

    public Shop setApproved(String id, boolean approved) {
        RepositoryValidationHelper.validateNotEmpty(id, "Shop ID");
        Shop shop = shopRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Shop not found with id: " + id));
        shop.setApproved(approved);
        return shopRepository.save(shop);
    }

    public void deleteShop(String id) {
        RepositoryValidationHelper.validateNotEmpty(id, "Shop ID");
        if (shopRepository.findById(id).isEmpty()) {
            throw new ResourceNotFoundException("Shop not found with id: " + id);
        }
        shopRepository.deleteById(id);
    }

    /**
     * Shared by create and update — both accept the same client-supplied fields, and a value
     * that is rejected on the way in should not be accepted later as an edit. Absent fields are
     * skipped, so this is safe for the partial-update pattern used above.
     */
    private void validateContactFields(Shop shop) {
        ValidationUtil.validateMaxLength(shop.getName(), ValidationUtil.MAX_SHORT_TEXT, "Shop name");
        ValidationUtil.validateMaxLength(shop.getAddress(), ValidationUtil.MAX_SHORT_TEXT, "Address");
        ValidationUtil.validateMaxLength(shop.getDescription(), ValidationUtil.MAX_LONG_TEXT, "Description");
        ValidationUtil.validateOptionalPhone(shop.getPhone(), "Phone number");
        ValidationUtil.validateOptionalEmail(shop.getEmail(), "Email");
        ValidationUtil.validateOptionalUrl(shop.getLogoUrl(), "Logo URL");
        ValidationUtil.validateMaxLength(shop.getLogoUrl(), ValidationUtil.MAX_SHORT_TEXT, "Logo URL");
    }

    private boolean canView(Shop shop) {
        if (shop.isApproved() && shop.isActive()) {
            return true;
        }
        return SecurityUtil.getCurrentUserId()
                .map(userId -> userId.equals(shop.getOwnerId()) || SecurityUtil.isCurrentUserStaff())
                .orElse(false);
    }
}
