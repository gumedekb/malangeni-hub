package co.za.malangeniblog.repository;

import co.za.malangeniblog.domain.LibraryInfo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LibraryInfoRepository extends JpaRepository<LibraryInfo, String> {
}
