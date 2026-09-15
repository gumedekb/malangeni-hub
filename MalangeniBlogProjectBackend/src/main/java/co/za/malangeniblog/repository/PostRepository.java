package co.za.malangeniblog.repository;

import co.za.malangeniblog.domain.Post;
import co.za.malangeniblog.domain.PostType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

/** Feed filters (types, group, author) are combined as a Specification in PostService. */
@Repository
public interface PostRepository extends JpaRepository<Post, String>, JpaSpecificationExecutor<Post> {
    Page<Post> findByType(PostType type, Pageable pageable);

    Page<Post> findByGroupId(String groupId, Pageable pageable);

    Page<Post> findByTypeAndGroupId(PostType type, String groupId, Pageable pageable);
}
