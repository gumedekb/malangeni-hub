package co.za.malangeniblog.controller;

import co.za.malangeniblog.domain.LibraryInfo;
import co.za.malangeniblog.service.LibraryInfoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/** Malangeni Library's details: anyone can read, the hub team edits. */
@RestController
@RequestMapping("/api/library")
public class LibraryInfoController {

    @Autowired
    private LibraryInfoService libraryInfoService;

    @GetMapping
    public ResponseEntity<LibraryInfo> getLibraryInfo() {
        return ResponseEntity.ok(libraryInfoService.getLibraryInfo());
    }

    @PutMapping
    @PreAuthorize("hasAnyRole('ADMIN','MODERATOR')")
    public ResponseEntity<LibraryInfo> updateLibraryInfo(@RequestBody LibraryInfo info) {
        return ResponseEntity.ok(libraryInfoService.updateLibraryInfo(info));
    }
}
