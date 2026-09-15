package co.za.malangeniblog.service;

import co.za.malangeniblog.domain.Group;
import co.za.malangeniblog.domain.GroupMembership;
import co.za.malangeniblog.exception.ResourceNotFoundException;
import co.za.malangeniblog.repository.GroupMembershipRepository;
import co.za.malangeniblog.repository.GroupRepository;
import co.za.malangeniblog.security.SecurityUtil;
import co.za.malangeniblog.util.IdGenerator;
import co.za.malangeniblog.util.RepositoryValidationHelper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class GroupService {

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private GroupMembershipRepository groupMembershipRepository;

    public Group createGroup(Group group) {
        RepositoryValidationHelper.validateNotEmpty(group.getName(), "Group name");
        if (RepositoryValidationHelper.isNullOrEmpty(group.getId())) {
            group.setId(IdGenerator.generateId());
        }
        return enrich(groupRepository.save(group));
    }

    public Optional<Group> getGroupById(String id) {
        RepositoryValidationHelper.validateNotEmpty(id, "Group ID");
        return groupRepository.findById(id).map(this::enrich);
    }

    public List<Group> getAllGroups() {
        return groupRepository.findAll().stream().map(this::enrich).toList();
    }

    @Transactional
    public void joinGroup(String groupId, String userId) {
        RepositoryValidationHelper.validateNotEmpty(groupId, "Group ID");
        if (groupRepository.findById(groupId).isEmpty()) {
            throw new ResourceNotFoundException("Group not found with id: " + groupId);
        }
        if (groupMembershipRepository.existsByGroupIdAndUserId(groupId, userId)) {
            return;
        }
        GroupMembership membership = new GroupMembership();
        membership.setId(IdGenerator.generateId());
        membership.setGroupId(groupId);
        membership.setUserId(userId);
        membership.setJoinedAt(LocalDateTime.now());
        groupMembershipRepository.save(membership);
    }

    @Transactional
    public void leaveGroup(String groupId, String userId) {
        RepositoryValidationHelper.validateNotEmpty(groupId, "Group ID");
        RepositoryValidationHelper.validateNotEmpty(userId, "User ID");
        groupMembershipRepository.deleteByGroupIdAndUserId(groupId, userId);
    }

    public List<GroupMembership> getMembers(String groupId) {
        RepositoryValidationHelper.validateNotEmpty(groupId, "Group ID");
        return groupMembershipRepository.findByGroupId(groupId);
    }

    public Group updateGroup(String id, Group group) {
        RepositoryValidationHelper.validateNotEmpty(id, "Group ID");
        return groupRepository.findById(id)
                .map(existing -> {
                    if (!RepositoryValidationHelper.isNullOrEmpty(group.getName())) {
                        existing.setName(group.getName());
                    }
                    if (!RepositoryValidationHelper.isNullOrEmpty(group.getIcon())) {
                        existing.setIcon(group.getIcon());
                    }
                    if (!RepositoryValidationHelper.isNullOrEmpty(group.getDescription())) {
                        existing.setDescription(group.getDescription());
                    }
                    return enrich(groupRepository.save(existing));
                })
                .orElseThrow(() -> new ResourceNotFoundException("Group not found with id: " + id));
    }

    @Transactional
    public void deleteGroup(String id) {
        RepositoryValidationHelper.validateNotEmpty(id, "Group ID");
        if (groupRepository.findById(id).isEmpty()) {
            throw new ResourceNotFoundException("Group not found with id: " + id);
        }
        // Posts still tagged to this group are left alone deliberately - the FK constraint
        // will reject the delete (surfaced as 409 by GlobalExceptionHandler) rather than
        // silently orphaning or cascading into someone else's post history.
        groupMembershipRepository.deleteByGroupId(id);
        groupRepository.deleteById(id);
    }

    private Group enrich(Group group) {
        if (group == null) {
            return null;
        }
        group.setMemberCount(groupMembershipRepository.countByGroupId(group.getId()));
        group.setJoinedByCurrentUser(SecurityUtil.getCurrentUserId()
                .map(userId -> groupMembershipRepository.existsByGroupIdAndUserId(group.getId(), userId))
                .orElse(null));
        return group;
    }
}
