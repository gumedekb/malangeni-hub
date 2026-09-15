package co.za.malangeniblog.domain;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.ser.std.StdSerializer;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * How a user appears to other members (post authors, shop owners, group members, public
 * profiles).
 *
 * <p>A whitelist rather than the old {@code @JsonIgnoreProperties} blacklist: a field added to
 * {@link User} later stays private unless it is written here. Backstage accounts are shown as
 * plain members, so the dev account never carries a staff tag in public. Field names follow the
 * frontend's PublicProfile type ({@code avatarUrl}, not {@code profileImageUrl}).
 */
public class PublicUserSerializer extends StdSerializer<User> {

    public PublicUserSerializer() {
        super(User.class);
    }

    public static Map<String, Object> toPublicMap(User user) {
        Map<String, Object> view = new LinkedHashMap<>();
        view.put("id", user.getId());
        view.put("username", user.getUsername());
        if (user.getDisplayName() != null) {
            view.put("displayName", user.getDisplayName());
        }
        if (user.getProfileImageUrl() != null) {
            view.put("avatarUrl", user.getProfileImageUrl());
        }
        Role role = user.isBackstage() ? Role.USER : user.getRole();
        if (role != null) {
            view.put("role", role.name());
        }
        if (user.getBadge() != null) {
            view.put("badge", user.getBadge());
        }
        if (user.getCreatedAt() != null) {
            view.put("createdAt", user.getCreatedAt());
        }
        return view;
    }

    @Override
    public void serialize(User user, JsonGenerator gen, SerializerProvider provider) throws IOException {
        provider.defaultSerializeValue(toPublicMap(user), gen);
    }
}
