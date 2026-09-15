package co.za.malangeniblog.controller;

import co.za.malangeniblog.domain.Rating;
import co.za.malangeniblog.dto.RatingRequest;
import co.za.malangeniblog.dto.RatingSummaryResponse;
import co.za.malangeniblog.security.SecurityUtil;
import co.za.malangeniblog.service.RatingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/attractions/{attractionId}/ratings")
public class RatingController {

    @Autowired
    private RatingService ratingService;

    @PostMapping
    public ResponseEntity<Rating> rateAttraction(@PathVariable String attractionId, @RequestBody RatingRequest request) {
        String userId = SecurityUtil.requireCurrentUserId();
        Rating rating = ratingService.rateAttraction(attractionId, userId, request.getScore(), request.getComment());
        return ResponseEntity.status(HttpStatus.CREATED).body(rating);
    }

    @GetMapping
    public ResponseEntity<List<Rating>> getRatings(@PathVariable String attractionId) {
        return ResponseEntity.ok(ratingService.getRatingsForAttraction(attractionId));
    }

    @GetMapping("/summary")
    public ResponseEntity<RatingSummaryResponse> getSummary(@PathVariable String attractionId) {
        return ResponseEntity.ok(ratingService.getSummary(attractionId));
    }
}
