package co.za.malangeniblog.service;

import co.za.malangeniblog.domain.News;
import co.za.malangeniblog.domain.User;
import co.za.malangeniblog.exception.BadRequestException;
import co.za.malangeniblog.repository.NewsRepository;
import co.za.malangeniblog.repository.UserRepository;
import co.za.malangeniblog.security.SecurityUtil;
import co.za.malangeniblog.util.IdGenerator;
import co.za.malangeniblog.util.RepositoryValidationHelper;
import co.za.malangeniblog.util.ValidationUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class NewsService {

    @Autowired
    private NewsRepository newsRepository;

    @Autowired
    private UserRepository userRepository;

    public News createNews(News news) {
        RepositoryValidationHelper.validateNotEmpty(news.getTitle(), "News title");
        validateFields(news);

        String authorId = SecurityUtil.requireCurrentUserId();
        requireNotBanned(authorId);
        // Overwrite rather than trust: the request body may carry any authorId it likes.
        news.setAuthorId(authorId);

        if (RepositoryValidationHelper.isNullOrEmpty(news.getId())) {
            news.setId(IdGenerator.generateId());
        }
        if (news.getPublishedAt() == null) {
            news.setPublishedAt(LocalDateTime.now());
        }
        return newsRepository.save(news);
    }

    /**
     * A posting ban blocks writing, not reading. Enforced here rather than in {@code @PreAuthorize}
     * because it is a per-user state change that must be re-read from the database on every
     * attempt - an annotation would need the ban baked into the token/authorities, which would go
     * stale the moment a moderator applied it.
     */
    private void requireNotBanned(String userId) {
        userRepository.findById(userId)
                .filter(User::isBannedFromPosting)
                .ifPresent(banned -> {
                    throw new BadRequestException(banned.getBanReason() == null
                            ? "You are currently banned from posting"
                            : "You are currently banned from posting: " + banned.getBanReason());
                });
    }

    public Optional<News> getNewsById(String id) {
        RepositoryValidationHelper.validateNotEmpty(id, "News ID");
        return newsRepository.findById(id);
    }

    public List<News> getNewsByCategory(String categoryId) {
        if (RepositoryValidationHelper.isNullOrEmpty(categoryId)) {
            return List.of();
        }
        return newsRepository.findByCategoryId(categoryId);
    }

    public List<News> searchByTitle(String title) {
        if (RepositoryValidationHelper.isNullOrEmpty(title)) {
            return newsRepository.findAll();
        }
        return newsRepository.findByTitleContainingIgnoreCase(title);
    }

    public Page<News> getRecentNews(LocalDateTime since, Pageable pageable) {
        if (since == null) {
            since = LocalDateTime.now().minusMonths(1);
        }
        return newsRepository.findByPublishedAtAfter(since, pageable);
    }

    public Page<News> getAllNews(Pageable pageable) {
        return newsRepository.findAll(pageable);
    }

    public News updateNews(String id, News news) {
        RepositoryValidationHelper.validateNotEmpty(id, "News ID");
        validateFields(news);
        SecurityUtil.getCurrentUserId().ifPresent(this::requireNotBanned);
        return newsRepository.findById(id)
                .map(existing -> {
                    if (!RepositoryValidationHelper.isNullOrEmpty(news.getTitle())) {
                        existing.setTitle(news.getTitle());
                    }
                    if (!RepositoryValidationHelper.isNullOrEmpty(news.getContent())) {
                        existing.setContent(news.getContent());
                    }
                    if (!RepositoryValidationHelper.isNullOrEmpty(news.getImageUrl())) {
                        existing.setImageUrl(news.getImageUrl());
                    }
                    if (news.getPublishedAt() != null) {
                        existing.setPublishedAt(news.getPublishedAt());
                    }
                    return newsRepository.save(existing);
                })
                .orElseThrow(() -> new IllegalArgumentException("News not found with id: " + id));
    }

    /** Shared by create and update so an invalid value cannot slip in as a later edit. */
    private void validateFields(News news) {
        ValidationUtil.validateMaxLength(news.getTitle(), ValidationUtil.MAX_SHORT_TEXT, "News title");
        ValidationUtil.validateMaxLength(news.getContent(), ValidationUtil.MAX_LONG_TEXT, "News content");
        ValidationUtil.validateOptionalUrl(news.getImageUrl(), "Image URL");
        ValidationUtil.validateMaxLength(news.getImageUrl(), ValidationUtil.MAX_SHORT_TEXT, "Image URL");
    }

    public void deleteNews(String id) {
        RepositoryValidationHelper.validateNotEmpty(id, "News ID");
        newsRepository.deleteById(id);
    }
}
