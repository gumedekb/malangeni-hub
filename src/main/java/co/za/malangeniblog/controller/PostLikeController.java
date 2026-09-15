package co.za.malangeniblog.controller;

import co.za.malangeniblog.dto.LikeSummaryResponse;
import co.za.malangeniblog.security.SecurityUtil;
import co.za.malangeniblog.service.LikeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/posts/{postId}/likes")
public class PostLikeController {

    @Autowired
    private LikeService likeService;

    @PostMapping
    public ResponseEntity<LikeSummaryResponse> like(@PathVariable String postId) {
        likeService.likePost(postId, SecurityUtil.requireCurrentUserId());
        return ResponseEntity.ok(likeService.getSummary(postId));
    }

    @DeleteMapping
    public ResponseEntity<LikeSummaryResponse> unlike(@PathVariable String postId) {
        likeService.unlikePost(postId, SecurityUtil.requireCurrentUserId());
        return ResponseEntity.ok(likeService.getSummary(postId));
    }

    @GetMapping("/summary")
    public ResponseEntity<LikeSummaryResponse> getSummary(@PathVariable String postId) {
        return ResponseEntity.ok(likeService.getSummary(postId));
    }
}
