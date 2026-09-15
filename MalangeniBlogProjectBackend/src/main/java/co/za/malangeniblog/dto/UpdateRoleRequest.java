package co.za.malangeniblog.dto;

import co.za.malangeniblog.domain.Role;

/** Admin-only role change. Separate from profile editing so the two can never be confused. */
public class UpdateRoleRequest {

    private Role role;

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }
}
