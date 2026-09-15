package co.za.malangeniblog.service;

import co.za.malangeniblog.domain.ContactMessage;
import co.za.malangeniblog.repository.ContactMessageRepository;
import co.za.malangeniblog.security.SecurityUtil;
import co.za.malangeniblog.util.IdGenerator;
import co.za.malangeniblog.util.RepositoryValidationHelper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ContactMessageService {

    @Autowired
    private ContactMessageRepository contactMessageRepository;

    public ContactMessage createMessage(ContactMessage message) {
        RepositoryValidationHelper.validateNotEmpty(message.getSubject(), "Subject");
        RepositoryValidationHelper.validateNotEmpty(message.getMessage(), "Message");
        if (RepositoryValidationHelper.isNullOrEmpty(message.getId())) {
            message.setId(IdGenerator.generateId());
        }
        // The author is always the authenticated caller, never a client-supplied value.
        message.setUserId(SecurityUtil.requireCurrentUserId());
        if (message.getDateSent() == null) {
            message.setDateSent(LocalDateTime.now());
        }
        return contactMessageRepository.save(message);
    }

    public Optional<ContactMessage> getMessageById(String id) {
        RepositoryValidationHelper.validateNotEmpty(id, "Message ID");
        return contactMessageRepository.findById(id);
    }

    public List<ContactMessage> getMessagesByUserId(String userId) {
        if (RepositoryValidationHelper.isNullOrEmpty(userId)) {
            return List.of();
        }
        return contactMessageRepository.findByUserId(userId);
    }

    public List<ContactMessage> searchBySubject(String subject) {
        if (RepositoryValidationHelper.isNullOrEmpty(subject)) {
            return contactMessageRepository.findAll();
        }
        return contactMessageRepository.findBySubjectContainingIgnoreCase(subject);
    }

    public Page<ContactMessage> getAllMessages(Pageable pageable) {
        return contactMessageRepository.findAll(pageable);
    }

    public void deleteMessage(String id) {
        RepositoryValidationHelper.validateNotEmpty(id, "Message ID");
        contactMessageRepository.deleteById(id);
    }
}
