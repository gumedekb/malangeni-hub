package co.za.malangeniblog.controller;

import co.za.malangeniblog.domain.CommunityProject;
import co.za.malangeniblog.service.CommunityProjectService;
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
@RequestMapping("/api/projects")
public class CommunityProjectController {

    @Autowired
    private CommunityProjectService communityProjectService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MODERATOR')")
    public ResponseEntity<CommunityProject> createProject(@RequestBody CommunityProject project) {
        return ResponseEntity.status(HttpStatus.CREATED).body(communityProjectService.createProject(project));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CommunityProject> getProjectById(@PathVariable String id) {
        Optional<CommunityProject> project = communityProjectService.getProjectById(id);
        return project.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<List<CommunityProject>> getProjectsByCategory(@PathVariable String categoryId) {
        return ResponseEntity.ok(communityProjectService.getProjectsByCategory(categoryId));
    }

    @GetMapping("/search/title")
    public ResponseEntity<List<CommunityProject>> searchByTitle(@RequestParam String title) {
        return ResponseEntity.ok(communityProjectService.searchByTitle(title));
    }

    @GetMapping("/organiser/{organiser}")
    public ResponseEntity<List<CommunityProject>> getProjectsByOrganiser(@PathVariable String organiser) {
        return ResponseEntity.ok(communityProjectService.getProjectsByOrganiser(organiser));
    }

    @GetMapping
    public ResponseEntity<Page<CommunityProject>> getAllProjects(@PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(communityProjectService.getAllProjects(pageable));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MODERATOR')")
    public ResponseEntity<CommunityProject> updateProject(@PathVariable String id, @RequestBody CommunityProject project) {
        return ResponseEntity.ok(communityProjectService.updateProject(id, project));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MODERATOR')")
    public ResponseEntity<Void> deleteProject(@PathVariable String id) {
        communityProjectService.deleteProject(id);
        return ResponseEntity.noContent().build();
    }
}
