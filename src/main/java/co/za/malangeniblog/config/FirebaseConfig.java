package co.za.malangeniblog.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseAuth;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;

/**
 * Initialises the Firebase Admin SDK once at startup.
 *
 * <p>Firebase is only ever used to answer one question: "is this ID token genuine, and who does
 * it belong to?" Roles, ownership and posting bans stay in this database - see TASKS.md Phase 11.
 */
@Configuration
public class FirebaseConfig {

    private static final Logger log = LoggerFactory.getLogger(FirebaseConfig.class);

    /**
     * Local development points at the downloaded service-account key. On Cloud Run the file does
     * not exist and must not - the runtime service account supplies Application Default
     * Credentials instead, so no secret is ever baked into the image.
     */
    @Value("${firebase.credentials-path:firebase-key.json}")
    private String credentialsPath;

    @Bean
    public FirebaseApp firebaseApp() throws IOException {
        // Spring DevTools restarts the context in place; initializeApp() throws if called twice.
        if (!FirebaseApp.getApps().isEmpty()) {
            return FirebaseApp.getInstance();
        }

        File keyFile = new File(credentialsPath);
        GoogleCredentials credentials;
        if (keyFile.exists()) {
            try (FileInputStream in = new FileInputStream(keyFile)) {
                credentials = GoogleCredentials.fromStream(in);
            }
            log.info("Firebase initialised from key file: {}", credentialsPath);
        } else {
            credentials = GoogleCredentials.getApplicationDefault();
            log.info("Firebase initialised from Application Default Credentials");
        }

        return FirebaseApp.initializeApp(FirebaseOptions.builder()
                .setCredentials(credentials)
                .build());
    }

    @Bean
    public FirebaseAuth firebaseAuth(FirebaseApp firebaseApp) {
        return FirebaseAuth.getInstance(firebaseApp);
    }
}
