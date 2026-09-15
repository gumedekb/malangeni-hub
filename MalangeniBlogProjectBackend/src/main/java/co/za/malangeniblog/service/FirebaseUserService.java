package co.za.malangeniblog.service;

import co.za.malangeniblog.domain.BadgeRequestStatus;
import co.za.malangeniblog.domain.Role;
import co.za.malangeniblog.domain.User;
import co.za.malangeniblog.repository.UserRepository;
import co.za.malangeniblog.security.CustomUserDetails;
import co.za.malangeniblog.util.IdGenerator;
import com.google.firebase.auth.FirebaseToken;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Locale;

/**
 * Maps a verified Firebase token onto a local {@link User} row, creating one on first sign-in.
 *
 * <p>The Firebase UID is the lookup key rather than username or email, because it is the only
 * identifier the user cannot change.
 */
@Service
public class FirebaseUserService {

    private static final Logger log = LoggerFactory.getLogger(FirebaseUserService.class);

    /** Give up rather than loop forever if a username stem is somehow exhausted. */
    private static final int MAX_USERNAME_ATTEMPTS = 100;

    /** Same limit the frontend enforces (lib/auth/types.ts). */
    private static final int USERNAME_MAX = 20;

    /** Longest Google name kept; anything longer is almost certainly not a real name. */
    private static final int DISPLAY_NAME_MAX = 100;

    @Autowired
    private UserRepository userRepository;

    /**
     * The admin list, and the only source of admins (TASKS.md 11.5b). Re-applied on every
     * request rather than only at row creation, so an admin whose account already existed as
     * USER is promoted, and removing an email from the list demotes it. UserService refuses to
     * grant or remove ADMIN through the API, so the two cannot fight.
     */
    @Value("${app.admin-emails:}")
    private String adminEmails;

    /** Staff who keep their permissions but are shown to the public as plain members. */
    @Value("${app.backstage-emails:}")
    private String backstageEmails;

    @Transactional
    public CustomUserDetails resolveUser(FirebaseToken token) {
        return new CustomUserDetails(applyConfiguredStaff(syncGoogleProfile(findOrCreate(token), token)));
    }

    /**
     * Keeps what other members see in step with the Google account, with one write only when
     * something changed:
     * <ul>
     *   <li>the display name ("Thabo Mokoena") follows the Google name;</li>
     *   <li>a username that was generated from the email address before names were used is
     *       replaced, once, by one built from the name ("thabo.mokoena");</li>
     *   <li>the Google photo is used until the member uploads their own. Removing an uploaded
     *       picture therefore falls back to the Google photo.</li>
     * </ul>
     */
    private User syncGoogleProfile(User user, FirebaseToken token) {
        boolean changed = false;

        String name = googleName(token);
        if (name != null && !name.equals(user.getDisplayName())) {
            user.setDisplayName(name);
            changed = true;
        }

        String handle = name == null ? null : handleFrom(name);
        if (handle != null && !handle.equals(user.getUsername()) && hasEmailDerivedUsername(user)) {
            String renamed = uniqueUsername(handle, user.getId());
            log.info("Renaming {} to {} (username now comes from the Google name)", user.getUsername(), renamed);
            user.setUsername(renamed);
            changed = true;
        }

        if (user.getProfileImageUrl() == null) {
            String photo = googlePhoto(token);
            if (photo != null) {
                user.setProfileImageUrl(photo);
                changed = true;
            }
        }
        return changed ? userRepository.save(user) : user;
    }

    private static String googlePhoto(FirebaseToken token) {
        String picture = token.getPicture();
        if (picture == null || !picture.startsWith("https://") || picture.length() > 512) {
            return null;
        }
        // Google hands out a blurry 96px thumbnail by default; ask for one sharp enough for the
        // profile page.
        return picture.replaceFirst("=s\\d+-c$", "=s256-c");
    }

    /** The Google account's full name, tidied, or null if the token carries none. */
    private static String googleName(FirebaseToken token) {
        String name = token.getName();
        if (name == null) {
            return null;
        }
        name = name.trim().replaceAll("\\s+", " ");
        if (name.isEmpty()) {
            return null;
        }
        return name.length() > DISPLAY_NAME_MAX ? name.substring(0, DISPLAY_NAME_MAX).trim() : name;
    }

    /** Cheap on the common path: two list lookups, and a write only when something changed. */
    private User applyConfiguredStaff(User user) {
        boolean changed = false;
        boolean listedAdmin = isListed(adminEmails, user.getEmail());
        if (listedAdmin && user.getRole() != Role.ADMIN) {
            log.info("Promoting {} to ADMIN (listed in app.admin-emails)", user.getUsername());
            user.setRole(Role.ADMIN);
            changed = true;
        } else if (!listedAdmin && user.getRole() == Role.ADMIN) {
            log.warn("Demoting {} from ADMIN (not listed in app.admin-emails)", user.getUsername());
            user.setRole(user.getBadgeRequestStatus() == BadgeRequestStatus.APPROVED
                    ? Role.BUSINESS_OWNER : Role.USER);
            changed = true;
        }
        boolean backstage = isListed(backstageEmails, user.getEmail());
        if (user.isBackstage() != backstage) {
            user.setBackstage(backstage);
            changed = true;
        }
        return changed ? userRepository.save(user) : user;
    }

    private User findOrCreate(FirebaseToken token) {
        // 1. Returning user - the common path, one indexed lookup.
        return userRepository.findByFirebaseUid(token.getUid())
                .orElseGet(() -> linkOrProvision(token));
    }

    private User linkOrProvision(FirebaseToken token) {
        String email = token.getEmail();
        if (email == null || email.isBlank()) {
            throw new UsernameNotFoundException(
                    "Firebase token for UID " + token.getUid() + " carries no email address");
        }
        // Guards the linking branch below: without this, anyone who could get a token carrying
        // an unverified address could claim the existing account that owns it.
        if (!token.isEmailVerified()) {
            throw new UsernameNotFoundException("Email address " + email + " is not verified");
        }

        // 2. Account linking. An account already exists under this email from the old
        // password login - claim it rather than creating a duplicate. This is also what lets
        // the existing admin keep their role after switching to Google sign-in (TASKS.md 11.5b);
        // without it, signing in would silently create a second, ordinary USER account.
        return userRepository.findByEmail(email)
                .map(existing -> {
                    existing.setFirebaseUid(token.getUid());
                    log.info("Linked Firebase UID to existing account {}", existing.getUsername());
                    return userRepository.save(existing);
                })
                .orElseGet(() -> provision(token, email));
    }

    private User provision(FirebaseToken token, String email) {
        String name = googleName(token);
        String handle = name == null ? null : handleFrom(name);

        User user = new User();
        user.setId(IdGenerator.generateId());
        user.setFirebaseUid(token.getUid());
        user.setEmail(email);
        user.setDisplayName(name);
        // From the Google name when there is one; the email stem only as a fallback.
        user.setUsername(uniqueUsername(handle != null ? handle : emailStem(email), null));
        user.setProfileImageUrl(googlePhoto(token));
        // No password: Firebase holds the credential. Admin/backstage flags are applied by
        // applyConfiguredStaff straight after this.
        user.setRole(Role.USER);
        user.setCreatedAt(LocalDateTime.now());

        try {
            User saved = userRepository.save(user);
            log.info("Provisioned new user {} from Google sign-in", saved.getUsername());
            return saved;
        } catch (DataIntegrityViolationException ex) {
            // Two first-time requests from the same account can race here. The unique constraint
            // on firebase_uid is the referee; the loser just re-reads the winner's row.
            return userRepository.findByFirebaseUid(token.getUid())
                    .orElseThrow(() -> ex);
        }
    }

    private static boolean isListed(String commaSeparated, String email) {
        if (commaSeparated == null || commaSeparated.isBlank() || email == null) {
            return false;
        }
        return Arrays.stream(commaSeparated.split(","))
                .map(String::trim)
                .anyMatch(configured -> configured.equalsIgnoreCase(email));
    }

    /**
     * "Thabo Mokoena" → "thabo.mokoena": accents dropped, anything that isn't a letter or digit
     * becomes a dot, and capped at the username limit. Null when too little is left (for
     * example a name written only in a non-Latin script), so the caller falls back to the email.
     */
    static String handleFrom(String name) {
        String ascii = Normalizer.normalize(name, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        String handle = ascii.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", ".")
                .replaceAll("^\\.+|\\.+$", "");
        if (handle.length() > USERNAME_MAX) {
            handle = handle.substring(0, USERNAME_MAX).replaceAll("\\.+$", "");
        }
        return handle.length() >= 3 ? handle : null;
    }

    /** The email local part, sanitised - how usernames were made before names were used. */
    private static String emailStem(String email) {
        String stem = rawEmailStem(email);
        return stem.length() > USERNAME_MAX ? stem.substring(0, USERNAME_MAX) : stem;
    }

    private static String rawEmailStem(String email) {
        String stem = email.substring(0, Math.max(0, email.indexOf('@')))
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9_]", "");
        return stem.length() < 3 ? "user" + stem : stem;
    }

    /** True while the username is still the one generated from the email (plus any numbering). */
    private static boolean hasEmailDerivedUsername(User user) {
        String username = user.getUsername();
        String email = user.getEmail();
        if (username == null || email == null || email.indexOf('@') < 0) {
            return false;
        }
        String stem = rawEmailStem(email);
        if (!username.startsWith(stem)) {
            return false;
        }
        String rest = username.substring(stem.length());
        return rest.matches("\\d*") || rest.matches("_[0-9a-zA-Z-]{8}");
    }

    /**
     * {@code stem}, or {@code stem} numbered on collision, kept within the username limit. A
     * username already held by {@code ownId} counts as free, so re-checking an account never
     * bumps its own name.
     */
    private String uniqueUsername(String stem, String ownId) {
        if (isFree(stem, ownId)) {
            return stem;
        }
        for (int i = 2; i < MAX_USERNAME_ATTEMPTS; i++) {
            String suffix = String.valueOf(i);
            String base = stem.length() + suffix.length() > USERNAME_MAX
                    ? stem.substring(0, USERNAME_MAX - suffix.length())
                    : stem;
            String candidate = base + suffix;
            if (isFree(candidate, ownId)) {
                return candidate;
            }
        }
        return stem.substring(0, Math.min(stem.length(), USERNAME_MAX - 9))
                + "_" + IdGenerator.generateId().substring(0, 8);
    }

    private boolean isFree(String username, String ownId) {
        return userRepository.findByUsername(username)
                .map(existing -> existing.getId().equals(ownId))
                .orElse(true);
    }
}
