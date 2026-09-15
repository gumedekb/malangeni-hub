package co.za.malangeniblog.service;

import co.za.malangeniblog.domain.Attraction;
import co.za.malangeniblog.exception.ResourceNotFoundException;
import co.za.malangeniblog.repository.AttractionRepository;
import co.za.malangeniblog.repository.CategoryRepository;
import co.za.malangeniblog.repository.RatingRepository;
import co.za.malangeniblog.util.IdGenerator;
import co.za.malangeniblog.util.RepositoryValidationHelper;
import co.za.malangeniblog.util.ValidationUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;

@Service
public class AttractionService {

    @Autowired
    private AttractionRepository attractionRepository;

    @Autowired
    private RatingRepository ratingRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ImageStorageService imageStorageService;

    public Attraction createAttraction(Attraction attraction) {
        RepositoryValidationHelper.validateNotEmpty(attraction.getName(), "Attraction name");
        RepositoryValidationHelper.validateNotEmpty(attraction.getLocation(), "Location");
        ValidationUtil.validateCoordinates(attraction.getLatitude(), attraction.getLongitude());
        validateFields(attraction);
        requireCategory(attraction.getCategoryId());
        attraction.setName(attraction.getName().trim());
        attraction.setLocation(attraction.getLocation().trim());
        // Pictures only arrive through POST /{id}/image (Cloudinary), never as a typed-in URL.
        attraction.setImageUrl(null);
        if (RepositoryValidationHelper.isNullOrEmpty(attraction.getId())) {
            attraction.setId(IdGenerator.generateId());
        }
        return enrichWithRating(attractionRepository.save(attraction));
    }

    public Optional<Attraction> getAttractionById(String id) {
        RepositoryValidationHelper.validateNotEmpty(id, "Attraction ID");
        return attractionRepository.findById(id).map(this::enrichWithRating);
    }

    public List<Attraction> getAttractionsByCategory(String categoryId) {
        if (RepositoryValidationHelper.isNullOrEmpty(categoryId)) {
            return List.of();
        }
        return enrichWithRating(attractionRepository.findByCategoryId(categoryId));
    }

    public List<Attraction> searchByLocation(String location) {
        if (RepositoryValidationHelper.isNullOrEmpty(location)) {
            return enrichWithRating(attractionRepository.findAll());
        }
        return enrichWithRating(attractionRepository.findByLocationContainingIgnoreCase(location));
    }

    public List<Attraction> searchByName(String name) {
        if (RepositoryValidationHelper.isNullOrEmpty(name)) {
            return enrichWithRating(attractionRepository.findAll());
        }
        return enrichWithRating(attractionRepository.findByNameContainingIgnoreCase(name));
    }

    public Page<Attraction> getAllAttractions(Pageable pageable) {
        return attractionRepository.findAll(pageable).map(this::enrichWithRating);
    }

    private Attraction enrichWithRating(Attraction attraction) {
        if (attraction == null) {
            return null;
        }
        attraction.setAverageRating(ratingRepository.findAverageScoreByAttractionId(attraction.getId()));
        attraction.setRatingCount(ratingRepository.countByAttractionId(attraction.getId()));
        return attraction;
    }

    private List<Attraction> enrichWithRating(List<Attraction> attractions) {
        attractions.forEach(this::enrichWithRating);
        return attractions;
    }

    public Attraction updateAttraction(String id, Attraction attraction) {
        RepositoryValidationHelper.validateNotEmpty(id, "Attraction ID");
        validateFields(attraction);
        return attractionRepository.findById(id)
                .map(existing -> {
                    if (!RepositoryValidationHelper.isNullOrEmpty(attraction.getName())) {
                        existing.setName(attraction.getName());
                    }
                    // Optional, so an empty description clears it; null leaves it alone.
                    if (attraction.getDescription() != null) {
                        existing.setDescription(attraction.getDescription().trim());
                    }
                    if (!RepositoryValidationHelper.isNullOrEmpty(attraction.getLocation())) {
                        existing.setLocation(attraction.getLocation());
                    }
                    if (!RepositoryValidationHelper.isNullOrEmpty(attraction.getCategoryId())) {
                        requireCategory(attraction.getCategoryId());
                        existing.setCategoryId(attraction.getCategoryId());
                    }
                    // The picture only changes through POST/DELETE /{id}/image.
                    // Validate against the pair the attraction will end up with, so updating only
                    // one half of an already-pinned location stays valid but half-pinning does not.
                    String newLatitude = RepositoryValidationHelper.isNullOrEmpty(attraction.getLatitude())
                            ? existing.getLatitude() : attraction.getLatitude();
                    String newLongitude = RepositoryValidationHelper.isNullOrEmpty(attraction.getLongitude())
                            ? existing.getLongitude() : attraction.getLongitude();
                    ValidationUtil.validateCoordinates(newLatitude, newLongitude);
                    existing.setLatitude(newLatitude);
                    existing.setLongitude(newLongitude);
                    return attractionRepository.save(existing);
                })
                .orElseThrow(() -> new IllegalArgumentException("Attraction not found with id: " + id));
    }

    /** Shared by create and update so an invalid value cannot slip in as a later edit. */
    private void validateFields(Attraction attraction) {
        ValidationUtil.validateMaxLength(attraction.getName(), ValidationUtil.MAX_SHORT_TEXT, "Attraction name");
        ValidationUtil.validateMaxLength(attraction.getLocation(), ValidationUtil.MAX_SHORT_TEXT, "Location");
        ValidationUtil.validateMaxLength(attraction.getDescription(), ValidationUtil.MAX_LONG_TEXT, "Description");
        ValidationUtil.validateOptionalUrl(attraction.getImageUrl(), "Image URL");
        ValidationUtil.validateMaxLength(attraction.getImageUrl(), ValidationUtil.MAX_SHORT_TEXT, "Image URL");
    }

    /** Deletes a place with its ratings and picture. */
    @Transactional
    public void deleteAttraction(String id) {
        Attraction attraction = findOrThrow(id);
        ratingRepository.deleteByAttractionId(id);
        attractionRepository.delete(attraction);
        if (attraction.getImageUrl() != null) {
            imageStorageService.deletePlaceImage(id);
        }
    }

    /** A place's picture, replacing any previous one. Hub team only. */
    public Attraction uploadImage(String id, MultipartFile file) {
        Attraction attraction = findOrThrow(id);
        attraction.setImageUrl(imageStorageService.uploadPlaceImage(id, file));
        return enrichWithRating(attractionRepository.save(attraction));
    }

    /** Removes a place's picture, stored file included. Hub team only. */
    public Attraction removeImage(String id) {
        Attraction attraction = findOrThrow(id);
        if (attraction.getImageUrl() != null) {
            imageStorageService.deletePlaceImage(id);
            attraction.setImageUrl(null);
            attraction = attractionRepository.save(attraction);
        }
        return enrichWithRating(attraction);
    }

    private Attraction findOrThrow(String id) {
        RepositoryValidationHelper.validateNotEmpty(id, "Attraction ID");
        return attractionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Attraction not found with id: " + id));
    }

    /** A place must point at a real category (Learning, Health...) when one is given. */
    private void requireCategory(String categoryId) {
        if (!RepositoryValidationHelper.isNullOrEmpty(categoryId) && !categoryRepository.existsById(categoryId)) {
            throw new ResourceNotFoundException("Category not found with id: " + categoryId);
        }
    }
}
