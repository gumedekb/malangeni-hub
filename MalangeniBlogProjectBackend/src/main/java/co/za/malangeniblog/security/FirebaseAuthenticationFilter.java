package co.za.malangeniblog.security;

import co.za.malangeniblog.service.FirebaseUserService;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Verifies the Firebase ID token on each request and puts the matching local user in the
 * SecurityContext.
 *
 * <p>Same shape as the JWT filter it replaces - the only change is who vouches for the token.
 * Everything downstream ({@code @PreAuthorize}, {@link SecurityUtil}, the ownership beans) reads
 * the same {@link CustomUserDetails} and is untouched: Firebase authenticates, this database
 * authorizes.
 */
@Component
public class FirebaseAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(FirebaseAuthenticationFilter.class);

    @Autowired
    private FirebaseAuth firebaseAuth;

    @Autowired
    private FirebaseUserService firebaseUserService;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String idToken = authHeader.substring(7);
        try {
            if (SecurityContextHolder.getContext().getAuthentication() == null) {
                // Checks the signature, the expiry and that the token was minted for THIS
                // Firebase project - a valid token from someone else's project is rejected.
                FirebaseToken decoded = firebaseAuth.verifyIdToken(idToken);
                CustomUserDetails userDetails = firebaseUserService.resolveUser(decoded);

                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        } catch (Exception ex) {
            // Leave the context empty and let the request continue: public endpoints still work,
            // protected ones fall through to the 401 entry point in SecurityConfig.
            SecurityContextHolder.clearContext();
            log.debug("Firebase token rejected: {}", ex.getMessage());
        }

        filterChain.doFilter(request, response);
    }
}
