package co.za.malangeniblog.security;

import co.za.malangeniblog.repository.PostRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component("postSecurity")
public class PostSecurity {

    @Autowired
    private PostRepository postRepository;

    public boolean isOwner(String postId, String userId) {
        if (postId == null || userId == null) {
            return false;
        }
        return postRepository.findById(postId)
                .map(post -> userId.equals(post.getAuthorId()))
                .orElse(false);
    }
}
