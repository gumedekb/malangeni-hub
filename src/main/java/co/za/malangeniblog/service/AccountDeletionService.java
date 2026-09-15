package co.za.malangeniblog.service;

import co.za.malangeniblog.domain.Role;
import co.za.malangeniblog.domain.User;
import co.za.malangeniblog.exception.BadRequestException;
import co.za.malangeniblog.exception.ResourceNotFoundException;
import co.za.malangeniblog.repository.UserRepository;
import co.za.malangeniblog.util.RepositoryValidationHelper;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.Collections;
import java.util.List;

/**
 * Deletes a member's account and everything they put on the hub: their posts (with the likes,
 * comments and pictures on them), comments, likes, group memberships, ratings, events, services,
 * directory listings, badge requests and news. Where they only reviewed someone else's item, the
 * reviewer is cleared instead. Their Firebase login goes too, so it really is gone.
 *
 * <p>Admin accounts can't be deleted: they come from ADMIN_EMAILS and would be recreated on the
 * next sign-in anyway.
 */
@Service
public class AccountDeletionService {

    private static final Logger log = LoggerFactory.getLogger(AccountDeletionService.class);

    /** Every "?" is the user id. Children before parents, so no foreign key is left dangling. */
    private static final String[] STATEMENTS = {
            "DELETE FROM likes WHERE user_id = ? OR post_id IN (SELECT id FROM posts WHERE author_id = ?)",
            // Replies first: a reply to one of their comments would otherwise block the delete.
            "DELETE FROM comments WHERE parent_comment_id IN (SELECT id FROM comments WHERE author_id = ?"
                    + " OR post_id IN (SELECT id FROM posts WHERE author_id = ?))",
            "DELETE FROM comments WHERE author_id = ? OR post_id IN (SELECT id FROM posts WHERE author_id = ?)",
            "DELETE FROM posts WHERE author_id = ?",
            "DELETE FROM group_memberships WHERE user_id = ?",
            "DELETE FROM ratings WHERE user_id = ?",
            "DELETE FROM events WHERE organiser_id = ?",
            "UPDATE events SET reviewed_by_user_id = NULL WHERE reviewed_by_user_id = ?",
            "DELETE FROM local_services WHERE provider_id = ?",
            "UPDATE local_services SET reviewed_by_user_id = NULL WHERE reviewed_by_user_id = ?",
            "UPDATE sponsors SET shop_id = NULL WHERE shop_id IN (SELECT id FROM shops WHERE owner_id = ?)",
            "DELETE FROM shops WHERE owner_id = ?",
            "DELETE FROM badge_requests WHERE user_id = ?",
            "UPDATE badge_requests SET reviewed_by_user_id = NULL WHERE reviewed_by_user_id = ?",
            "UPDATE badge_requests SET revoked_by_user_id = NULL WHERE revoked_by_user_id = ?",
            "DELETE FROM news WHERE author_id = ?",
            "DELETE FROM contact_messages WHERE user_id = ?",
            "DELETE FROM users WHERE id = ?",
    };

    @Autowired
    private JdbcTemplate jdbc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ImageStorageService imageStorageService;

    @Transactional
    public void deleteAccount(String userId) {
        RepositoryValidationHelper.validateNotEmpty(userId, "User ID");
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        if (user.getRole() == Role.ADMIN) {
            throw new BadRequestException("Admin accounts come from ADMIN_EMAILS and can't be deleted here");
        }

        // Read what needs cleaning up elsewhere before the rows disappear.
        List<String> postImages = jdbc.queryForList(
                "SELECT id FROM posts WHERE author_id = ? AND image_url IS NOT NULL", String.class, userId);
        List<String> eventImages = jdbc.queryForList(
                "SELECT id FROM events WHERE organiser_id = ? AND image_url IS NOT NULL", String.class, userId);
        List<String> serviceImages = jdbc.queryForList(
                "SELECT id FROM local_services WHERE provider_id = ? AND image_url IS NOT NULL", String.class, userId);
        boolean uploadedAvatar = user.getProfileImageUrl() != null
                && user.getProfileImageUrl().contains("/malangeni/avatars/");
        String firebaseUid = user.getFirebaseUid();

        for (String sql : STATEMENTS) {
            int params = (int) sql.chars().filter(c -> c == '?').count();
            jdbc.update(sql, Collections.nCopies(params, userId).toArray());
        }
        log.info("Deleted account {}", user.getUsername());

        // Files and the Firebase login only go once the rows are really gone.
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                postImages.forEach(imageStorageService::deletePostImage);
                eventImages.forEach(imageStorageService::deleteEventImage);
                serviceImages.forEach(imageStorageService::deleteServiceImage);
                if (uploadedAvatar) {
                    imageStorageService.deleteAvatar(userId);
                }
                deleteFirebaseLogin(firebaseUid);
            }
        });
    }

    private static void deleteFirebaseLogin(String uid) {
        if (uid == null) {
            return;
        }
        try {
            FirebaseAuth.getInstance().deleteUser(uid);
        } catch (FirebaseAuthException | IllegalStateException ex) {
            // The account data is gone either way; a leftover login just means signing in again
            // creates a fresh, empty account.
            log.warn("Could not delete Firebase login {}", uid, ex);
        }
    }
}
