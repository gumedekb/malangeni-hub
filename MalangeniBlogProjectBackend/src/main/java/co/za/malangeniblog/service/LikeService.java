package co.za.malangeniblog.service;

import co.za.malangeniblog.domain.Like;
import co.za.malangeniblog.dto.LikeSummaryResponse;
import co.za.malangeniblog.exception.ResourceNotFoundException;
import co.za.malangeniblog.repository.LikeRepository;
import co.za.malangeniblog.repository.PostRepository;
import co.za.malangeniblog.security.SecurityUtil;
import co.za.malangeniblog.util.IdGenerator;
import co.za.malangeniblog.util.RepositoryValidationHelper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class LikeService {

    @Autowired
    private LikeRepository likeRepository;

    @Autowired
    private PostRepository postRepository;

    @Transactional
    public void likePost(String postId, String userId) {
        RepositoryValidationHelper.validateNotEmpty(postId, "Post ID");
        if (postRepository.findById(postId).isEmpty()) {
            throw new ResourceNotFoundException("Post not found with id: " + postId);
        }
        if (likeRepository.existsByPostIdAndUserId(postId, userId)) {
            return;
        }
        Like like = new Like();
        like.setId(IdGenerator.generateId());
        like.setPostId(postId);
        like.setUserId(userId);
        like.setCreatedAt(LocalDateTime.now());
        likeRepository.save(like);
    }

    @Transactional
    public void unlikePost(String postId, String userId) {
        RepositoryValidationHelper.validateNotEmpty(postId, "Post ID");
        likeRepository.deleteByPostIdAndUserId(postId, userId);
    }

    public LikeSummaryResponse getSummary(String postId) {
        RepositoryValidationHelper.validateNotEmpty(postId, "Post ID");
        long count = likeRepository.countByPostId(postId);
        boolean likedByCurrentUser = SecurityUtil.getCurrentUserId()
                .map(userId -> likeRepository.existsByPostIdAndUserId(postId, userId))
                .orElse(false);
        return new LikeSummaryResponse(count, likedByCurrentUser);
    }
}
