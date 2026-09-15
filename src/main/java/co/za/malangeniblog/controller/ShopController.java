package co.za.malangeniblog.controller;

import co.za.malangeniblog.domain.Shop;
import co.za.malangeniblog.security.SecurityUtil;
import co.za.malangeniblog.service.ShopService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

/** The local business directory. Listing only - no products, orders or shop websites. */
@RestController
@RequestMapping("/api/shops")
public class ShopController {

    @Autowired
    private ShopService shopService;

    /** Confirmed business owners (approved badge) only; starts hidden until staff approve it. */
    @PostMapping
    public ResponseEntity<Shop> createShop(@RequestBody Shop shop) {
        return ResponseEntity.status(HttpStatus.CREATED).body(shopService.createShop(shop));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Shop> getShopById(@PathVariable String id) {
        Optional<Shop> shop = shopService.getShopById(id);
        return shop.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping
    public ResponseEntity<Page<Shop>> listShops(
            @RequestParam(required = false) String categoryId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(shopService.listShops(categoryId, pageable));
    }

    @GetMapping("/mine")
    public ResponseEntity<List<Shop>> getMyShops() {
        return ResponseEntity.ok(shopService.getMyShops(SecurityUtil.requireCurrentUserId()));
    }

    /** Staff review list: {@code approved=false} is the queue, {@code true} the live listings. */
    @GetMapping("/review")
    @PreAuthorize("hasAnyRole('ADMIN','MODERATOR')")
    public ResponseEntity<Page<Shop>> listForReview(
            @RequestParam(defaultValue = "false") boolean approved,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(shopService.listForReview(approved, pageable));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @shopSecurity.isOwner(#id, authentication.principal.id)")
    public ResponseEntity<Shop> updateShop(@PathVariable String id, @RequestBody Shop shop) {
        return ResponseEntity.ok(shopService.updateShop(id, shop));
    }

    /** Owner hides/shows their own listing without deleting it. */
    @PutMapping("/{id}/active")
    @PreAuthorize("hasRole('ADMIN') or @shopSecurity.isOwner(#id, authentication.principal.id)")
    public ResponseEntity<Shop> setActive(@PathVariable String id, @RequestParam boolean active) {
        return ResponseEntity.ok(shopService.setActive(id, active));
    }

    /** Staff approve a listing, or take it down again. */
    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN','MODERATOR')")
    public ResponseEntity<Shop> setApproved(@PathVariable String id, @RequestParam boolean approved) {
        return ResponseEntity.ok(shopService.setApproved(id, approved));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @shopSecurity.isOwner(#id, authentication.principal.id)")
    public ResponseEntity<Void> deleteShop(@PathVariable String id) {
        shopService.deleteShop(id);
        return ResponseEntity.noContent().build();
    }
}
