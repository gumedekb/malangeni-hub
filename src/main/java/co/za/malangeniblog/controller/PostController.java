package co.za.malangeniblog.controller;

import co.za.malangeniblog.domain.Post;
import co.za.malangeniblog.domain.PostType;
import co.za.malangeniblog.service.PostService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    @Autowired
    private PostService postService;

    @PostMapping
    public ResponseEntity<Post> createPost(@RequestBody Post post) {
        return ResponseEntity.status(HttpStatus.CREATED).body(postService.createPost(post));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Post> getPostById(@PathVariable String id) {
        Optional<Post> post = postService.getPostById(id);
        return post.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * Paginated feed. Every filter is optional and they combine: {@code type} may repeat
     * ({@code ?type=NEWS&type=JOB}) for the home feed, {@code groupId} for a group page and
     * {@code authorId} for a profile.
     */
    @GetMapping
    public ResponseEntity<Page<Post>> listPosts(
            @RequestParam(required = false) List<PostType> type,
            @RequestParam(required = false) String groupId,
            @RequestParam(required = false) String authorId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(postService.listPosts(type, groupId, authorId, pageable));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MODERATOR') or @postSecurity.isOwner(#id, authentication.principal.id)")
    public ResponseEntity<Post> updatePost(@PathVariable String id, @RequestBody Post post) {
        return ResponseEntity.ok(postService.updatePost(id, post));
    }

    /** Optional picture (multipart field {@code file}). Author or hub team. */
    @PostMapping(value = "/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','MODERATOR') or @postSecurity.isOwner(#id, authentication.principal.id)")
    public ResponseEntity<Post> uploadImage(@PathVariable String id, @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(postService.uploadImage(id, file));
    }

    /** Removes the picture. Author or hub team. */
    @DeleteMapping("/{id}/image")
    @PreAuthorize("hasAnyRole('ADMIN','MODERATOR') or @postSecurity.isOwner(#id, authentication.principal.id)")
    public ResponseEntity<Post> removeImage(@PathVariable String id) {
        return ResponseEntity.ok(postService.removeImage(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MODERATOR') or @postSecurity.isOwner(#id, authentication.principal.id)")
    public ResponseEntity<Void> deletePost(@PathVariable String id) {
        postService.deletePost(id);
        return ResponseEntity.noContent().build();
    }
}
