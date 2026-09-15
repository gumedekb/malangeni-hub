package co.za.malangeniblog.repository;

import co.za.malangeniblog.domain.Shop;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ShopRepository extends JpaRepository<Shop, String> {
    Page<Shop> findByApprovedTrueAndActiveTrue(Pageable pageable);

    Page<Shop> findByApprovedTrueAndActiveTrueAndCategoryId(String categoryId, Pageable pageable);

    /** Staff review list, oldest first so nobody waits indefinitely. */
    Page<Shop> findByApprovedOrderByCreatedAtAsc(boolean approved, Pageable pageable);

    List<Shop> findByOwnerId(String ownerId);
}
