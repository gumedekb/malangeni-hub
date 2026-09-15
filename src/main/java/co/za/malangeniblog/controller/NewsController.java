package co.za.malangeniblog.controller;

import co.za.malangeniblog.domain.News;
import co.za.malangeniblog.service.NewsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/news")
public class NewsController {

    @Autowired
    private NewsService newsService;

    /** Any signed-in community member may publish news. The posting ban is enforced in the service. */
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<News> createNews(@RequestBody News news) {
        return ResponseEntity.status(HttpStatus.CREATED).body(newsService.createNews(news));
    }

    @GetMapping("/{id}")
    public ResponseEntity<News> getNewsById(@PathVariable String id) {
        Optional<News> news = newsService.getNewsById(id);
        return news.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<List<News>> getNewsByCategory(@PathVariable String categoryId) {
        return ResponseEntity.ok(newsService.getNewsByCategory(categoryId));
    }

    @GetMapping("/search/title")
    public ResponseEntity<List<News>> searchByTitle(@RequestParam String title) {
        return ResponseEntity.ok(newsService.searchByTitle(title));
    }

    @GetMapping("/recent")
    public ResponseEntity<Page<News>> getRecentNews(
            @RequestParam(required = false) LocalDateTime since,
            Pageable pageable) {
        return ResponseEntity.ok(newsService.getRecentNews(since, pageable));
    }

    @GetMapping
    public ResponseEntity<Page<News>> getAllNews(@PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(newsService.getAllNews(pageable));
    }

    /** Members edit only their own news; moderators and admins may edit anyone's. */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MODERATOR') or @newsSecurity.isOwner(#id, authentication.principal.id)")
    public ResponseEntity<News> updateNews(@PathVariable String id, @RequestBody News news) {
        return ResponseEntity.ok(newsService.updateNews(id, news));
    }

    /** Same rule as update: own news, or any news if moderator/admin. */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MODERATOR') or @newsSecurity.isOwner(#id, authentication.principal.id)")
    public ResponseEntity<Void> deleteNews(@PathVariable String id) {
        newsService.deleteNews(id);
        return ResponseEntity.noContent().build();
    }
}
