package co.za.malangeniblog.security;

import co.za.malangeniblog.repository.NewsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component("newsSecurity")
public class NewsSecurity {

    @Autowired
    private NewsRepository newsRepository;

    public boolean isOwner(String newsId, String userId) {
        if (newsId == null || userId == null) {
            return false;
        }
        return newsRepository.findById(newsId)
                .map(news -> userId.equals(news.getAuthorId()))
                .orElse(false);
    }
}
