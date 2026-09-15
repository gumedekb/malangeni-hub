package co.za.malangeniblog.service;

import co.za.malangeniblog.domain.LibraryInfo;
import co.za.malangeniblog.repository.LibraryInfoRepository;
import co.za.malangeniblog.security.SecurityUtil;
import co.za.malangeniblog.util.OpeningHours;
import co.za.malangeniblog.util.RepositoryValidationHelper;
import co.za.malangeniblog.util.ValidationUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class LibraryInfoService {

    /** The id of the single library row (seeded by V8). */
    public static final String ID = "main";

    @Autowired
    private LibraryInfoRepository libraryInfoRepository;

    /** The library's details, or a name-only placeholder if the row is missing. */
    public LibraryInfo getLibraryInfo() {
        return libraryInfoRepository.findById(ID).orElseGet(() -> {
            LibraryInfo placeholder = new LibraryInfo();
            placeholder.setId(ID);
            placeholder.setName("Malangeni Library");
            return placeholder;
        });
    }

    /** Replaces every editable field. Id, updatedAt and updatedBy are set here, never by the client. */
    @Transactional
    public LibraryInfo updateLibraryInfo(LibraryInfo input) {
        RepositoryValidationHelper.validateNotEmpty(input.getName(), "Name");
        ValidationUtil.validateMaxLength(input.getName(), ValidationUtil.MAX_SHORT_TEXT, "Name");
        ValidationUtil.validateMaxLength(input.getAbout(), 1000, "About");
        ValidationUtil.validateMaxLength(input.getLocation(), ValidationUtil.MAX_SHORT_TEXT, "Location");
        ValidationUtil.validateOptionalUrl(input.getMapsUrl(), "Map link");
        ValidationUtil.validateMaxLength(input.getMapsUrl(), 512, "Map link");
        OpeningHours.validate(input.getWeekdayOpen(), input.getWeekdayClose(), "Mon-Fri");
        OpeningHours.validate(input.getSaturdayOpen(), input.getSaturdayClose(), "Saturday");
        OpeningHours.validate(input.getSundayOpen(), input.getSundayClose(), "Sunday");

        LibraryInfo info = libraryInfoRepository.findById(ID).orElseGet(() -> {
            LibraryInfo created = new LibraryInfo();
            created.setId(ID);
            return created;
        });
        info.setName(input.getName().trim());
        info.setAbout(blankToNull(input.getAbout()));
        info.setLocation(blankToNull(input.getLocation()));
        info.setMapsUrl(blankToNull(input.getMapsUrl()));
        info.setWeekdayOpen(input.getWeekdayOpen());
        info.setWeekdayClose(input.getWeekdayClose());
        info.setSaturdayOpen(input.getSaturdayOpen());
        info.setSaturdayClose(input.getSaturdayClose());
        info.setSundayOpen(input.getSundayOpen());
        info.setSundayClose(input.getSundayClose());
        info.setUpdatedAt(LocalDateTime.now());
        info.setUpdatedByUserId(SecurityUtil.requireCurrentUserId());
        return libraryInfoRepository.save(info);
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
