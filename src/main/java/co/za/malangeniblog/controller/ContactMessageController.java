package co.za.malangeniblog.controller;

import co.za.malangeniblog.domain.ContactMessage;
import co.za.malangeniblog.service.ContactMessageService;
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

@RestController
@RequestMapping("/api/messages")
public class ContactMessageController {

    @Autowired
    private ContactMessageService contactMessageService;

    @PostMapping
    public ResponseEntity<ContactMessage> createMessage(@RequestBody ContactMessage message) {
        return ResponseEntity.status(HttpStatus.CREATED).body(contactMessageService.createMessage(message));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ContactMessage> getMessageById(@PathVariable String id) {
        Optional<ContactMessage> message = contactMessageService.getMessageById(id);
        return message.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasRole('ADMIN') or #userId == authentication.principal.id")
    public ResponseEntity<List<ContactMessage>> getMessagesByUserId(@PathVariable String userId) {
        return ResponseEntity.ok(contactMessageService.getMessagesByUserId(userId));
    }

    @GetMapping("/search")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ContactMessage>> searchBySubject(@RequestParam String subject) {
        return ResponseEntity.ok(contactMessageService.searchBySubject(subject));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<ContactMessage>> getAllMessages(@PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(contactMessageService.getAllMessages(pageable));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteMessage(@PathVariable String id) {
        contactMessageService.deleteMessage(id);
        return ResponseEntity.noContent().build();
    }
}
