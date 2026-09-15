package co.za.malangeniblog.service;

import co.za.malangeniblog.domain.CommunityProject;
import co.za.malangeniblog.repository.CommunityProjectRepository;
import co.za.malangeniblog.util.IdGenerator;
import co.za.malangeniblog.util.RepositoryValidationHelper;
import co.za.malangeniblog.util.ValidationUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CommunityProjectService {

    @Autowired
    private CommunityProjectRepository communityProjectRepository;

    public CommunityProject createProject(CommunityProject project) {
        RepositoryValidationHelper.validateNotEmpty(project.getTitle(), "Project title");
        validateFields(project);
        if (RepositoryValidationHelper.isNullOrEmpty(project.getId())) {
            project.setId(IdGenerator.generateId());
        }
        return communityProjectRepository.save(project);
    }

    public Optional<CommunityProject> getProjectById(String id) {
        RepositoryValidationHelper.validateNotEmpty(id, "Project ID");
        return communityProjectRepository.findById(id);
    }

    public List<CommunityProject> getProjectsByCategory(String categoryId) {
        if (RepositoryValidationHelper.isNullOrEmpty(categoryId)) {
            return List.of();
        }
        return communityProjectRepository.findByCategoryId(categoryId);
    }

    public List<CommunityProject> searchByTitle(String title) {
        if (RepositoryValidationHelper.isNullOrEmpty(title)) {
            return communityProjectRepository.findAll();
        }
        return communityProjectRepository.findByTitleContainingIgnoreCase(title);
    }

    public List<CommunityProject> getProjectsByOrganiser(String organiser) {
        if (RepositoryValidationHelper.isNullOrEmpty(organiser)) {
            return List.of();
        }
        return communityProjectRepository.findByOrganiser(organiser);
    }

    public Page<CommunityProject> getAllProjects(Pageable pageable) {
        return communityProjectRepository.findAll(pageable);
    }

    public CommunityProject updateProject(String id, CommunityProject project) {
        RepositoryValidationHelper.validateNotEmpty(id, "Project ID");
        validateFields(project);
        return communityProjectRepository.findById(id)
                .map(existing -> {
                    if (!RepositoryValidationHelper.isNullOrEmpty(project.getTitle())) {
                        existing.setTitle(project.getTitle());
                    }
                    if (!RepositoryValidationHelper.isNullOrEmpty(project.getDescription())) {
                        existing.setDescription(project.getDescription());
                    }
                    if (!RepositoryValidationHelper.isNullOrEmpty(project.getOrganiser())) {
                        existing.setOrganiser(project.getOrganiser());
                    }
                    if (!RepositoryValidationHelper.isNullOrEmpty(project.getImageUrl())) {
                        existing.setImageUrl(project.getImageUrl());
                    }
                    return communityProjectRepository.save(existing);
                })
                .orElseThrow(() -> new IllegalArgumentException("Project not found with id: " + id));
    }

    /** Shared by create and update so an invalid value cannot slip in as a later edit. */
    private void validateFields(CommunityProject project) {
        ValidationUtil.validateMaxLength(project.getTitle(), ValidationUtil.MAX_SHORT_TEXT, "Project title");
        ValidationUtil.validateMaxLength(project.getOrganiser(), ValidationUtil.MAX_SHORT_TEXT, "Organiser");
        ValidationUtil.validateMaxLength(project.getDescription(), ValidationUtil.MAX_LONG_TEXT, "Description");
        ValidationUtil.validateOptionalUrl(project.getImageUrl(), "Image URL");
        ValidationUtil.validateMaxLength(project.getImageUrl(), ValidationUtil.MAX_SHORT_TEXT, "Image URL");
    }

    public void deleteProject(String id) {
        RepositoryValidationHelper.validateNotEmpty(id, "Project ID");
        communityProjectRepository.deleteById(id);
    }
}
