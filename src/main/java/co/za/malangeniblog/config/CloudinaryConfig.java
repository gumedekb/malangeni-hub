package co.za.malangeniblog.config;

import com.cloudinary.Cloudinary;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Cloudinary hosts user-uploaded images.
 *
 * <p>The whole configuration is one URL of the form
 * {@code cloudinary://<api-key>:<api-secret>@<cloud-name>} - it contains the API secret, so it is
 * supplied by the environment and never committed.
 */
@Configuration
public class CloudinaryConfig {

    /**
     * No default on purpose: a missing value should fail at startup rather than silently
     * producing an unconfigured client that only errors on the first upload attempt.
     */
    @Value("${cloudinary.url}")
    private String cloudinaryUrl;

    @Bean
    public Cloudinary cloudinary() {
        return new Cloudinary(cloudinaryUrl);
    }
}
