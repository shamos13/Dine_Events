package com.dineevents.media;

import com.cloudinary.Cloudinary;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class CloudinaryService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif"
    );
    private static final long MAX_BYTES = 5L * 1024 * 1024;

    private final Cloudinary cloudinary;

    @Value("${app.cloudinary.cloud-name:}")
    private String cloudName;

    @Value("${app.cloudinary.api-key:}")
    private String apiKey;

    @Value("${app.cloudinary.api-secret:}")
    private String apiSecret;

    /** Optional unsigned/signed upload preset configured in the Cloudinary console. */
    @Value("${app.cloudinary.upload-preset:}")
    private String uploadPreset;

    public UploadResult uploadImage(MultipartFile file, String folder) {
        validateConfig();
        validateFile(file);

        String targetFolder = sanitizeFolder(folder);
        try {
            Map<String, Object> options = new HashMap<>();
            options.put("folder", "dine-events/" + targetFolder);
            options.put("resource_type", "image");
            options.put("overwrite", false);
            if (!isBlank(uploadPreset)) {
                options.put("upload_preset", uploadPreset.trim());
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> result = cloudinary.uploader().upload(file.getBytes(), options);

            String url = (String) result.get("secure_url");
            if (url == null || url.isBlank()) {
                url = (String) result.get("url");
            }
            if (url == null || url.isBlank()) {
                throw new IllegalStateException("Cloudinary upload succeeded but no image URL was returned.");
            }

            String publicId = (String) result.get("public_id");
            log.info("Uploaded image to Cloudinary folder={} publicId={}", targetFolder, publicId);
            return new UploadResult(url, publicId);
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to upload image to Cloudinary.", exception);
        } catch (RuntimeException exception) {
            throw new IllegalStateException(friendlyCloudinaryMessage(exception), exception);
        }
    }

    private String friendlyCloudinaryMessage(RuntimeException exception) {
        String message = exception.getMessage() == null ? "" : exception.getMessage();
        if (message.contains("missing permissions") || message.contains("actions=[\"create\"]")) {
            return "Cloudinary rejected the upload: this API key cannot create assets. "
                    + "In Cloudinary Console → Settings → API Keys, open this key and assign a role "
                    + "with upload/create permission (e.g. Master Admin), then restart the server.";
        }
        if (message.contains("Invalid Signature") || message.contains("Invalid API Key")) {
            return "Cloudinary rejected the upload: check app.cloudinary.cloud-name, api-key, and api-secret.";
        }
        return "Unable to upload image to Cloudinary: " + message;
    }

    private void validateConfig() {
        if (isBlank(cloudName) || isBlank(apiKey) || isBlank(apiSecret)) {
            throw new IllegalStateException(
                    "Cloudinary is not configured. Set app.cloudinary.cloud-name, api-key, and api-secret."
            );
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("An image file is required.");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new IllegalArgumentException("Image must be 5MB or smaller.");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase(Locale.ROOT))) {
            throw new IllegalArgumentException("Only JPEG, PNG, WEBP, and GIF images are allowed.");
        }
    }

    private String sanitizeFolder(String folder) {
        if (folder == null || folder.isBlank()) {
            return "general";
        }
        String cleaned = folder.trim().toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9/_-]", "");
        return cleaned.isBlank() ? "general" : cleaned;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    public record UploadResult(String url, String publicId) {}
}
