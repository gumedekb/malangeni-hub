package co.za.malangeniblog.service;

import co.za.malangeniblog.domain.Attraction;
import co.za.malangeniblog.domain.Rating;
import co.za.malangeniblog.dto.RatingSummaryResponse;
import co.za.malangeniblog.exception.BadRequestException;
import co.za.malangeniblog.exception.ResourceNotFoundException;
import co.za.malangeniblog.repository.AttractionRepository;
import co.za.malangeniblog.repository.RatingRepository;
import co.za.malangeniblog.util.IdGenerator;
import co.za.malangeniblog.util.RepositoryValidationHelper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class RatingService {

    @Autowired
    private RatingRepository ratingRepository;

    @Autowired
    private AttractionRepository attractionRepository;

    public Rating rateAttraction(String attractionId, String userId, int score, String comment) {
        RepositoryValidationHelper.validateNotEmpty(attractionId, "Attraction ID");
        RepositoryValidationHelper.validateNotEmpty(userId, "User ID");
        if (score < 1 || score > 5) {
            throw new BadRequestException("Score must be between 1 and 5");
        }

        Attraction attraction = attractionRepository.findById(attractionId)
                .orElseThrow(() -> new ResourceNotFoundException("Attraction not found with id: " + attractionId));

        Rating rating = ratingRepository.findByAttractionIdAndUserId(attractionId, userId)
                .orElseGet(Rating::new);
        if (rating.getId() == null) {
            rating.setId(IdGenerator.generateId());
            rating.setAttractionId(attraction.getId());
            rating.setUserId(userId);
        }
        rating.setScore(score);
        rating.setComment(comment);
        rating.setCreatedAt(LocalDateTime.now());
        return ratingRepository.save(rating);
    }

    public List<Rating> getRatingsForAttraction(String attractionId) {
        RepositoryValidationHelper.validateNotEmpty(attractionId, "Attraction ID");
        return ratingRepository.findByAttractionId(attractionId);
    }

    public RatingSummaryResponse getSummary(String attractionId) {
        RepositoryValidationHelper.validateNotEmpty(attractionId, "Attraction ID");
        Double average = ratingRepository.findAverageScoreByAttractionId(attractionId);
        long count = ratingRepository.countByAttractionId(attractionId);
        return new RatingSummaryResponse(average, count);
    }
}
