package co.za.malangeniblog.service;

import co.za.malangeniblog.domain.Comment;
import co.za.malangeniblog.exception.BadRequestException;
import co.za.malangeniblog.exception.ResourceNotFoundException;
import co.za.malangeniblog.repository.CommentRepository;
import co.za.malangeniblog.repository.PostRepository;
import co.za.malangeniblog.security.SecurityUtil;
import co.za.malangeniblog.util.IdGenerator;
import co.za.malangeniblog.util.RepositoryValidationHelper;
import co.za.malangeniblog.util.ValidationUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class CommentService {

    /** Room for a proper reply, short enough that a comment stays a comment. */
    public static final int MAX_COMMENT_LENGTH = 2000;

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private PostRepository postRepository;

    /**
     * Posting bans do not apply here on purpose: a ban stops someone writing posts, news, events
     * and services, but they can still read and comment (see User.bannedFromPosting).
     */
    public Comment createComment(String postId, String body, String parentCommentId) {
        RepositoryValidationHelper.validateNotEmpty(postId, "Post ID");
        RepositoryValidationHelper.validateNotEmpty(body, "Comment");
        String text = body.trim();
        ValidationUtil.validateMaxLength(text, MAX_COMMENT_LENGTH, "Comment");
        if (postRepository.findById(postId).isEmpty()) {
            throw new ResourceNotFoundException("Post not found with id: " + postId);
        }

        if (!RepositoryValidationHelper.isNullOrEmpty(parentCommentId)) {
            Comment parent = commentRepository.findById(parentCommentId)
                    .orElseThrow(() -> new ResourceNotFoundException("Comment not found with id: " + parentCommentId));
            if (!postId.equals(parent.getPostId())) {
                throw new BadRequestException("Parent comment does not belong to this post");
            }
            if (!RepositoryValidationHelper.isNullOrEmpty(parent.getParentCommentId())) {
                throw new BadRequestException("Replies can only be one level deep");
            }
        }

        Comment comment = new Comment();
        comment.setId(IdGenerator.generateId());
        comment.setPostId(postId);
        comment.setAuthorId(SecurityUtil.requireCurrentUserId());
        comment.setBody(text);
        comment.setParentCommentId(RepositoryValidationHelper.isNullOrEmpty(parentCommentId) ? null : parentCommentId);
        comment.setCreatedAt(LocalDateTime.now());
        return commentRepository.save(comment);
    }

    public List<Comment> getCommentsForPost(String postId) {
        RepositoryValidationHelper.validateNotEmpty(postId, "Post ID");
        return commentRepository.findByPostIdOrderByCreatedAtAsc(postId);
    }

    @Transactional
    public void deleteComment(String id) {
        RepositoryValidationHelper.validateNotEmpty(id, "Comment ID");
        if (commentRepository.findById(id).isEmpty()) {
            throw new ResourceNotFoundException("Comment not found with id: " + id);
        }
        // One level of nesting only, so direct replies can simply be removed with the parent.
        commentRepository.deleteByParentCommentId(id);
        commentRepository.deleteById(id);
    }
}
