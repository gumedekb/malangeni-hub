package co.za.malangeniblog.service;

import co.za.malangeniblog.domain.Post;
import co.za.malangeniblog.domain.PostType;
import co.za.malangeniblog.domain.User;
import co.za.malangeniblog.exception.BadRequestException;
import co.za.malangeniblog.exception.ResourceNotFoundException;
import co.za.malangeniblog.repository.CommentRepository;
import co.za.malangeniblog.repository.GroupRepository;
import co.za.malangeniblog.repository.LikeRepository;
import co.za.malangeniblog.repository.PostRepository;
import co.za.malangeniblog.repository.UserRepository;
import co.za.malangeniblog.security.SecurityUtil;
import co.za.malangeniblog.util.IdGenerator;
import co.za.malangeniblog.util.RepositoryValidationHelper;
import co.za.malangeniblog.util.ValidationUtil;
import jakarta.persistence.criteria.Predicate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class PostService {

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private LikeRepository likeRepository;

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ImageStorageService imageStorageService;

    public Post createPost(Post post) {
        RepositoryValidationHelper.validateNotEmpty(post.getTitle(), "Post title");
        // Details are optional: the community composer is title-first, and a title alone is a
        // valid post. The column is NOT NULL, so "no details" is stored as an empty string.
        post.setTitle(post.getTitle().trim());
        post.setBody(post.getBody() == null ? "" : post.getBody().trim());
        // Pictures only arrive through POST /{id}/image (stored on Cloudinary). A client-supplied
        // URL could point anywhere, so one sent here is ignored.
        post.setImageUrl(null);
        validateFields(post);
        String authorId = SecurityUtil.requireCurrentUserId();
        requireNotBanned(authorId);
        if (RepositoryValidationHelper.isNullOrEmpty(post.getGroupId())) {
            post.setGroupId(null);
        } else if (groupRepository.findById(post.getGroupId()).isEmpty()) {
            throw new ResourceNotFoundException("Group not found with id: " + post.getGroupId());
        }
        if (RepositoryValidationHelper.isNullOrEmpty(post.getId())) {
            post.setId(IdGenerator.generateId());
        }
        // The author is always the authenticated caller, never a client-supplied value.
        post.setAuthorId(authorId);
        if (post.getType() == null) {
            post.setType(PostType.COMMUNITY);
        }
        post.setCreatedAt(LocalDateTime.now());
        return enrich(postRepository.save(post));
    }

    /** Same rule as news and events: a posting ban blocks writing, re-read on every attempt. */
    private void requireNotBanned(String userId) {
        userRepository.findById(userId)
                .filter(User::isBannedFromPosting)
                .ifPresent(banned -> {
                    throw new BadRequestException(banned.getBanReason() == null
                            ? "You are currently banned from posting"
                            : "You are currently banned from posting: " + banned.getBanReason());
                });
    }

    public Optional<Post> getPostById(String id) {
        RepositoryValidationHelper.validateNotEmpty(id, "Post ID");
        return postRepository.findById(id).map(this::enrich);
    }

    /** Every filter is optional; the ones given are combined with AND. */
    public Page<Post> listPosts(List<PostType> types, String groupId, String authorId, Pageable pageable) {
        Specification<Post> filters = (root, query, cb) -> {
            List<Predicate> where = new ArrayList<>();
            if (types != null && !types.isEmpty()) {
                where.add(root.get("type").in(types));
            }
            if (!RepositoryValidationHelper.isNullOrEmpty(groupId)) {
                where.add(cb.equal(root.get("groupId"), groupId));
            }
            if (!RepositoryValidationHelper.isNullOrEmpty(authorId)) {
                where.add(cb.equal(root.get("authorId"), authorId));
            }
            return cb.and(where.toArray(new Predicate[0]));
        };
        return postRepository.findAll(filters, pageable).map(this::enrich);
    }

    /**
     * Edits the title, details and tag. A null field is left alone; an empty details string
     * clears the details (they are optional), while the title can never be blanked.
     */
    public Post updatePost(String id, Post post) {
        RepositoryValidationHelper.validateNotEmpty(id, "Post ID");
        validateFields(post);
        requireNotBanned(SecurityUtil.requireCurrentUserId());
        return postRepository.findById(id)
                .map(existing -> {
                    if (post.getTitle() != null) {
                        RepositoryValidationHelper.validateNotEmpty(post.getTitle(), "Post title");
                        existing.setTitle(post.getTitle().trim());
                    }
                    if (post.getBody() != null) {
                        existing.setBody(post.getBody().trim());
                    }
                    if (post.getType() != null) {
                        existing.setType(post.getType());
                    }
                    return enrich(postRepository.save(existing));
                })
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + id));
    }

    /** Optional picture for a post, replacing any previous one. Author or hub team. */
    public Post uploadImage(String id, MultipartFile file) {
        RepositoryValidationHelper.validateNotEmpty(id, "Post ID");
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + id));
        post.setImageUrl(imageStorageService.uploadPostImage(id, file));
        return enrich(postRepository.save(post));
    }

    /** Removes a post's picture, stored file included. Author or hub team. */
    public Post removeImage(String id) {
        RepositoryValidationHelper.validateNotEmpty(id, "Post ID");
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + id));
        if (post.getImageUrl() != null) {
            imageStorageService.deletePostImage(id);
            post.setImageUrl(null);
            post = postRepository.save(post);
        }
        return enrich(post);
    }

    /** Shared by create and update so an invalid value cannot slip in as a later edit. */
    private void validateFields(Post post) {
        ValidationUtil.validateMaxLength(post.getTitle(), ValidationUtil.MAX_SHORT_TEXT, "Post title");
        ValidationUtil.validateMaxLength(post.getBody(), ValidationUtil.MAX_LONG_TEXT, "Post body");
    }

    @Transactional
    public void deletePost(String id) {
        RepositoryValidationHelper.validateNotEmpty(id, "Post ID");
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + id));
        likeRepository.deleteByPostId(id);
        commentRepository.deleteByPostId(id);
        postRepository.deleteById(id);
        if (post.getImageUrl() != null) {
            imageStorageService.deletePostImage(id);
        }
    }

    private Post enrich(Post post) {
        if (post == null) {
            return null;
        }
        post.setLikeCount(likeRepository.countByPostId(post.getId()));
        post.setCommentCount(commentRepository.countByPostId(post.getId()));
        post.setLikedByCurrentUser(SecurityUtil.getCurrentUserId()
                .map(userId -> likeRepository.existsByPostIdAndUserId(post.getId(), userId))
                .orElse(false));
        return post;
    }
}
