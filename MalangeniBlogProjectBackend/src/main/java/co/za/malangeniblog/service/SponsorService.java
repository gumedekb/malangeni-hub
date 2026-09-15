package co.za.malangeniblog.service;

import co.za.malangeniblog.domain.Sponsor;
import co.za.malangeniblog.domain.SponsorPlacement;
import co.za.malangeniblog.exception.BadRequestException;
import co.za.malangeniblog.exception.ResourceNotFoundException;
import co.za.malangeniblog.repository.ShopRepository;
import co.za.malangeniblog.repository.SponsorRepository;
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
import java.util.concurrent.ThreadLocalRandom;

@Service
public class SponsorService {

    @Autowired
    private SponsorRepository sponsorRepository;

    @Autowired
    private ShopRepository shopRepository;

    public Sponsor createSponsor(Sponsor sponsor) {
        RepositoryValidationHelper.validateNotEmpty(sponsor.getTitle(), "Sponsor title");
        if (sponsor.getPlacement() == null) {
            throw new BadRequestException("Sponsor placement is required (HOME, EXPLORE, COMMUNITY, SERVICES or FEED)");
        }
        validateWindow(sponsor.getStartAt(), sponsor.getEndAt());
        validateUrls(sponsor);
        if (!RepositoryValidationHelper.isNullOrEmpty(sponsor.getShopId())
                && shopRepository.findById(sponsor.getShopId()).isEmpty()) {
            throw new ResourceNotFoundException("Shop not found with id: " + sponsor.getShopId());
        }
        if (RepositoryValidationHelper.isNullOrEmpty(sponsor.getId())) {
            sponsor.setId(IdGenerator.generateId());
        }
        sponsor.setActive(true);
        sponsor.setCreatedAt(LocalDateTime.now());
        return sponsorRepository.save(sponsor);
    }

    /**
     * One currently-active sponsor for a placement. Random pick doubles as stateless
     * rotation: with several active sponsors, repeat page loads spread impressions.
     */
    public Optional<Sponsor> getActiveSponsor(SponsorPlacement placement) {
        if (placement == null) {
            throw new BadRequestException("placement query parameter is required");
        }
        List<Sponsor> candidates = sponsorRepository.findCurrentlyActiveByPlacement(placement, LocalDateTime.now());
        if (candidates.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(candidates.get(ThreadLocalRandom.current().nextInt(candidates.size())));
    }

    public Optional<Sponsor> getSponsorById(String id) {
        RepositoryValidationHelper.validateNotEmpty(id, "Sponsor ID");
        return sponsorRepository.findById(id);
    }

    public Page<Sponsor> getAllSponsors(Pageable pageable) {
        return sponsorRepository.findAll(pageable);
    }

    public Sponsor updateSponsor(String id, Sponsor sponsor) {
        RepositoryValidationHelper.validateNotEmpty(id, "Sponsor ID");
        validateUrls(sponsor);
        return sponsorRepository.findById(id)
                .map(existing -> {
                    if (!RepositoryValidationHelper.isNullOrEmpty(sponsor.getTitle())) {
                        existing.setTitle(sponsor.getTitle());
                    }
                    if (!RepositoryValidationHelper.isNullOrEmpty(sponsor.getPitch())) {
                        existing.setPitch(sponsor.getPitch());
                    }
                    if (!RepositoryValidationHelper.isNullOrEmpty(sponsor.getImageUrl())) {
                        existing.setImageUrl(sponsor.getImageUrl());
                    }
                    if (!RepositoryValidationHelper.isNullOrEmpty(sponsor.getTargetUrl())) {
                        existing.setTargetUrl(sponsor.getTargetUrl());
                    }
                    if (sponsor.getPlacement() != null) {
                        existing.setPlacement(sponsor.getPlacement());
                    }
                    if (!RepositoryValidationHelper.isNullOrEmpty(sponsor.getShopId())) {
                        if (shopRepository.findById(sponsor.getShopId()).isEmpty()) {
                            throw new ResourceNotFoundException("Shop not found with id: " + sponsor.getShopId());
                        }
                        existing.setShopId(sponsor.getShopId());
                    }
                    if (sponsor.getStartAt() != null) {
                        existing.setStartAt(sponsor.getStartAt());
                    }
                    if (sponsor.getEndAt() != null) {
                        existing.setEndAt(sponsor.getEndAt());
                    }
                    validateWindow(existing.getStartAt(), existing.getEndAt());
                    return sponsorRepository.save(existing);
                })
                .orElseThrow(() -> new ResourceNotFoundException("Sponsor not found with id: " + id));
    }

    public Sponsor setActive(String id, boolean active) {
        RepositoryValidationHelper.validateNotEmpty(id, "Sponsor ID");
        Sponsor sponsor = sponsorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sponsor not found with id: " + id));
        sponsor.setActive(active);
        return sponsorRepository.save(sponsor);
    }

    public void deleteSponsor(String id) {
        RepositoryValidationHelper.validateNotEmpty(id, "Sponsor ID");
        if (sponsorRepository.findById(id).isEmpty()) {
            throw new ResourceNotFoundException("Sponsor not found with id: " + id);
        }
        sponsorRepository.deleteById(id);
    }

    /**
     * targetUrl is rendered as a clickable link on every page carrying an ad slot, so it is the
     * highest-risk URL in the app — it must be a real http(s) destination, not a javascript: or
     * file: scheme. Shared by create and update.
     */
    private void validateUrls(Sponsor sponsor) {
        ValidationUtil.validateOptionalUrl(sponsor.getImageUrl(), "Image URL");
        ValidationUtil.validateOptionalUrl(sponsor.getTargetUrl(), "Target URL");
        ValidationUtil.validateMaxLength(sponsor.getImageUrl(), ValidationUtil.MAX_SHORT_TEXT, "Image URL");
        ValidationUtil.validateMaxLength(sponsor.getTargetUrl(), ValidationUtil.MAX_SHORT_TEXT, "Target URL");
        ValidationUtil.validateMaxLength(sponsor.getTitle(), ValidationUtil.MAX_SHORT_TEXT, "Sponsor title");
    }

    private void validateWindow(LocalDateTime startAt, LocalDateTime endAt) {
        if (startAt != null && endAt != null && endAt.isBefore(startAt)) {
            throw new BadRequestException("Sponsor end date must not be before its start date");
        }
    }
}
