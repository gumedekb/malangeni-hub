package co.za.malangeniblog.security;

import co.za.malangeniblog.repository.ShopRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component("shopSecurity")
public class ShopSecurity {

    @Autowired
    private ShopRepository shopRepository;

    public boolean isOwner(String shopId, String userId) {
        if (shopId == null || userId == null) {
            return false;
        }
        return shopRepository.findById(shopId)
                .map(shop -> userId.equals(shop.getOwnerId()))
                .orElse(false);
    }
}
