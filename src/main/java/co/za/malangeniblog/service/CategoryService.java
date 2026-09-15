package co.za.malangeniblog.service;

import co.za.malangeniblog.domain.Category;
import co.za.malangeniblog.repository.CategoryRepository;
import co.za.malangeniblog.util.IdGenerator;
import co.za.malangeniblog.util.RepositoryValidationHelper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    public Category createCategory(Category category) {
        RepositoryValidationHelper.validateNotEmpty(category.getName(), "Category name");
        if (RepositoryValidationHelper.isNullOrEmpty(category.getId())) {
            category.setId(IdGenerator.generateId());
        }
        return categoryRepository.save(category);
    }

    public Optional<Category> getCategoryById(String id) {
        RepositoryValidationHelper.validateNotEmpty(id, "Category ID");
        return categoryRepository.findById(id);
    }

    public Optional<Category> getCategoryByName(String name) {
        if (RepositoryValidationHelper.isNullOrEmpty(name)) {
            return Optional.empty();
        }
        return categoryRepository.findByName(name);
    }

    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    public Category updateCategory(String id, Category category) {
        RepositoryValidationHelper.validateNotEmpty(id, "Category ID");
        return categoryRepository.findById(id)
                .map(existing -> {
                    if (!RepositoryValidationHelper.isNullOrEmpty(category.getName())) {
                        existing.setName(category.getName());
                    }
                    return categoryRepository.save(existing);
                })
                .orElseThrow(() -> new IllegalArgumentException("Category not found with id: " + id));
    }

    public void deleteCategory(String id) {
        RepositoryValidationHelper.validateNotEmpty(id, "Category ID");
        categoryRepository.deleteById(id);
    }
}
