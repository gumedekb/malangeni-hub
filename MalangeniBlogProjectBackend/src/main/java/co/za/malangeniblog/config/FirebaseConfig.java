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

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

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

    /**
     * The key file's contents, as raw JSON or base64 (FIREBASE_CREDENTIALS_JSON). For hosts where
     * mounting a file is awkward, e.g. Render. Takes priority over the file when set.
     */
    @Value("${firebase.credentials-json:}")
    private String credentialsJson;

    @Bean
    public FirebaseApp firebaseApp() throws IOException {
        // Spring DevTools restarts the context in place; initializeApp() throws if called twice.
        if (!FirebaseApp.getApps().isEmpty()) {
            return FirebaseApp.getInstance();
        }

        return FirebaseApp.initializeApp(FirebaseOptions.builder()
                .setCredentials(loadCredentials())
                .build());
    }

    /** 1. FIREBASE_CREDENTIALS_JSON, 2. the key file, 3. Application Default Credentials (Cloud Run). */
    private GoogleCredentials loadCredentials() throws IOException {
        if (credentialsJson != null && !credentialsJson.isBlank()) {
            String value = credentialsJson.trim();
            byte[] json = value.startsWith("{")
                    ? value.getBytes(StandardCharsets.UTF_8)
                    : Base64.getDecoder().decode(value.replaceAll("\\s", ""));
            log.info("Firebase initialised from FIREBASE_CREDENTIALS_JSON");
            return GoogleCredentials.fromStream(new ByteArrayInputStream(json));
        }

        File keyFile = new File(credentialsPath);
        if (keyFile.isFile()) {
            if (!keyFile.canRead()) {
                throw new IllegalStateException("Firebase key file exists but this process can't read it: " + credentialsPath);
            }
            try (FileInputStream in = new FileInputStream(keyFile)) {
                log.info("Firebase initialised from key file: {}", credentialsPath);
                return GoogleCredentials.fromStream(in);
            }
        }

        // Says exactly what was looked for, so a missing secret isn't mistaken for a Google problem.
        log.warn("No Firebase key file at {} and FIREBASE_CREDENTIALS_JSON is not set; "
                + "trying Application Default Credentials (only available on Google Cloud)", credentialsPath);
        return GoogleCredentials.getApplicationDefault();
    }

    @Bean
    public FirebaseAuth firebaseAuth(FirebaseApp firebaseApp) {
        return FirebaseAuth.getInstance(firebaseApp);
    }
}
