package co.za.malangeniblog.repository;

import co.za.malangeniblog.domain.ContactMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContactMessageRepository extends JpaRepository<ContactMessage, String> {
    List<ContactMessage> findByUserId(String userId);
    List<ContactMessage> findBySubjectContainingIgnoreCase(String subject);
}
