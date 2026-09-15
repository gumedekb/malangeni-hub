package co.za.malangeniblog.repository;

import co.za.malangeniblog.domain.News;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NewsRepository extends JpaRepository<News, String> {
    List<News> findByCategoryId(String categoryId);
    List<News> findByTitleContainingIgnoreCase(String title);
    Page<News> findByPublishedAtAfter(LocalDateTime date, Pageable pageable);
}
