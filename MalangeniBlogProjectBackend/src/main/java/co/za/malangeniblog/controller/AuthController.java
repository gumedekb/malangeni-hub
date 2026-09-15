package co.za.malangeniblog.controller;

import co.za.malangeniblog.domain.User;
import co.za.malangeniblog.security.CustomUserDetails;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * All that remains of /api/auth after the Firebase cutover.
 *
 * <p>There is no /login or /register any more - sign-in happens in the browser against Firebase.
 * The frontend calls this once it has a token, to find out who the backend thinks it is and what
 * role it has.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @GetMapping("/me")
    public ResponseEntity<User> me(@AuthenticationPrincipal CustomUserDetails principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        // The row is provisioned by FirebaseUserService during token verification, so by the
        // time this runs the account always exists.
        return ResponseEntity.ok(principal.getUser());
    }
}
