package co.za.malangeniblog.repository;

import co.za.malangeniblog.domain.Attraction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AttractionRepository extends JpaRepository<Attraction, String> {
    List<Attraction> findByCategoryId(String categoryId);
    List<Attraction> findByLocationContainingIgnoreCase(String location);
    List<Attraction> findByNameContainingIgnoreCase(String name);
}
