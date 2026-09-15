package co.za.malangeniblog.security;

import co.za.malangeniblog.repository.CommentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component("commentSecurity")
public class CommentSecurity {

    @Autowired
    private CommentRepository commentRepository;

    public boolean isOwner(String commentId, String userId) {
        if (commentId == null || userId == null) {
            return false;
        }
        return commentRepository.findById(commentId)
                .map(comment -> userId.equals(comment.getAuthorId()))
                .orElse(false);
    }
}
