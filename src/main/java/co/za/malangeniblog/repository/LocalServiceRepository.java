package co.za.malangeniblog.repository;

import co.za.malangeniblog.domain.ApprovalStatus;
import co.za.malangeniblog.domain.LocalService;
import co.za.malangeniblog.domain.ServiceCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LocalServiceRepository extends JpaRepository<LocalService, String> {
    /** Public directory, alphabetical. */
    Page<LocalService> findByStatusOrderByNameAsc(ApprovalStatus status, Pageable pageable);

    Page<LocalService> findByStatusAndServiceCategoryOrderByNameAsc(
            ApprovalStatus status, ServiceCategory category, Pageable pageable);

    /** Staff queue, oldest submission first. */
    Page<LocalService> findByStatusOrderByCreatedAtAsc(ApprovalStatus status, Pageable pageable);

    List<LocalService> findByProviderIdOrderByCreatedAtDesc(String providerId);
}
