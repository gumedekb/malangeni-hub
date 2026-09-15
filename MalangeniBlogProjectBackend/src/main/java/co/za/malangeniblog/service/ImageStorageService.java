package co.za.malangeniblog.service;

import co.za.malangeniblog.exception.BadRequestException;
import com.cloudinary.Cloudinary;
import com.cloudinary.Transformation;
import com.cloudinary.utils.ObjectUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.Set;

/**
 * Uploads user images to Cloudinary and hands back the URL to store on the entity.
 *
 * <p>Nothing is written to local disk: Cloud Run containers are ephemeral, so a file saved there
 * disappears on the next restart or scale-to-zero.
 */
@Service
public class ImageStorageService {

    private static final Logger log = LoggerFactory.getLogger(ImageStorageService.class);

    /** Matches what the frontend produces after resizing on the phone. */
    private static final Set<String> ALLOWED_TYPES = Set.of("image/jpeg", "image/png", "image/webp");

    /** Generous for an image the browser may already have resized; rejects obvious abuse. */
    private static final long MAX_BYTES = 5L * 1024 * 1024;

    @Autowired
    private Cloudinary cloudinary;

    /**
     * Stores a member's avatar under a deterministic public id, overwriting whatever was there.
     *
     * <p>Using {@code avatars/<userId>} rather than a random name means replacing a picture
     * replaces the file too, instead of leaving every old avatar behind forever.
     */
    public String uploadAvatar(String userId, MultipartFile file) {
        // Server-side safety net: square, face-aware, capped size, regardless of what was sent.
        return upload("malangeni/avatars/" + userId, file,
                new Transformation<>().width(512).height(512).crop("fill").gravity("face").quality("auto"));
    }

    /** Removes the stored avatar file. Safe to call when there is nothing there. */
    public void deleteAvatar(String userId) {
        destroy("malangeni/avatars/" + userId);
    }

    /** An event's optional picture; same deterministic-id approach as avatars. */
    public String uploadEventImage(String eventId, MultipartFile file) {
        // Keep the shape (posters are often portrait), just cap the size.
        return upload("malangeni/events/" + eventId, file,
                new Transformation<>().width(1200).height(1200).crop("limit").quality("auto"));
    }

    public void deleteEventImage(String eventId) {
        destroy("malangeni/events/" + eventId);
    }

    /** A community post's optional picture. Keeps its shape, capped in size. */
    public String uploadPostImage(String postId, MultipartFile file) {
        return upload("malangeni/posts/" + postId, file,
                new Transformation<>().width(1600).height(1600).crop("limit").quality("auto"));
    }

    public void deletePostImage(String postId) {
        destroy("malangeni/posts/" + postId);
    }

    /** A service listing's optional picture. */
    public String uploadServiceImage(String serviceId, MultipartFile file) {
        return upload("malangeni/services/" + serviceId, file,
                new Transformation<>().width(1200).height(1200).crop("limit").quality("auto"));
    }

    public void deleteServiceImage(String serviceId) {
        destroy("malangeni/services/" + serviceId);
    }

    /** A place's picture on Explore. Keeps its shape, capped in size; cards crop it on delivery. */
    public String uploadPlaceImage(String placeId, MultipartFile file) {
        return upload("malangeni/places/" + placeId, file,
                new Transformation<>().width(1600).height(1600).crop("limit").quality("auto"));
    }

    public void deletePlaceImage(String placeId) {
        destroy("malangeni/places/" + placeId);
    }

    private String upload(String publicId, MultipartFile file, Transformation<?> transformation) {
        validate(file);
        try {
            Map<?, ?> result = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                    "public_id", publicId,
                    "overwrite", true,
                    // Without this, Cloudinary's CDN keeps serving the previous image from cache.
                    "invalidate", true,
                    "resource_type", "image",
                    "transformation", transformation
            ));
            log.info("Uploaded image {}", publicId);
            return (String) result.get("secure_url");
        } catch (IOException ex) {
            log.error("Cloudinary upload failed for {}", publicId, ex);
            throw new BadRequestException("Image upload failed, please try again");
        }
    }

    private void destroy(String publicId) {
        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.asMap("invalidate", true));
            log.info("Deleted image {}", publicId);
        } catch (IOException ex) {
            // The database row is cleared either way - a leftover file is not worth failing on.
            log.warn("Cloudinary delete failed for {}", publicId, ex);
        }
    }

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("No image was supplied");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new BadRequestException("Image must be 5MB or smaller");
        }
        // Content type is client-supplied and therefore a hint, not proof - Cloudinary rejects
        // non-images itself. This just returns a clear error before spending the upload.
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType.toLowerCase())) {
            throw new BadRequestException("Image must be a JPEG, PNG or WebP");
        }
    }
}
