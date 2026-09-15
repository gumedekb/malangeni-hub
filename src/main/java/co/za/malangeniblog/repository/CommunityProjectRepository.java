package co.za.malangeniblog.repository;

import co.za.malangeniblog.domain.CommunityProject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommunityProjectRepository extends JpaRepository<CommunityProject, String> {
    List<CommunityProject> findByCategoryId(String categoryId);
    List<CommunityProject> findByTitleContainingIgnoreCase(String title);
    List<CommunityProject> findByOrganiser(String organiser);
}
