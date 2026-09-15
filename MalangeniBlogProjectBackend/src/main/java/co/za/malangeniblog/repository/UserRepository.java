package co.za.malangeniblog.repository;

import co.za.malangeniblog.domain.Role;
import co.za.malangeniblog.domain.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);

    // The lookup key once Firebase is the authenticator - see TASKS.md Phase 11.
    Optional<User> findByFirebaseUid(String firebaseUid);

    /** Newest members for the community sidebar. Backstage staff are left out. */
    List<User> findByBackstageFalseOrderByCreatedAtDesc(Pageable pageable);

    long countByBackstageFalseAndCreatedAtAfter(LocalDateTime since);

    /** Accounts with any of these roles, e.g. the hub team (ADMIN, MODERATOR). */
    Page<User> findByRoleIn(Collection<Role> roles, Pageable pageable);

    /** The admin's member search: username, Google name or email containing the term. */
    List<User> findTop10ByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrDisplayNameContainingIgnoreCaseOrderByUsernameAsc(
            String username, String email, String displayName);
}
