package co.za.malangeniblog.repository;

import co.za.malangeniblog.domain.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, String> {
    List<Comment> findByPostIdOrderByCreatedAtAsc(String postId);

    long countByPostId(String postId);

    void deleteByPostId(String postId);

    void deleteByParentCommentId(String parentCommentId);
}
