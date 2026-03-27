package com.gym.controller;

import com.gym.dto.UpdateUserRequest;
import com.gym.dto.UserDTO;
import com.gym.dto.UserStatsDTO;
import com.gym.entity.User;
import com.gym.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<Page<UserDTO>> getUsers(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "false") boolean expiringSoon,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        if (expiringSoon) {
            return ResponseEntity.ok(userService.getExpiringSoonUsers(PageRequest.of(page, size)));
        }
        return ResponseEntity.ok(userService.getUsers(search, PageRequest.of(page, size)));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<UserStatsDTO> getStats() {
        return ResponseEntity.ok(userService.getStats());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getUserById(@PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        if (currentUser.getRole() == User.Role.USER && !currentUser.getId().equals(id)) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<UserDTO> updateUser(@PathVariable Long id,
            @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(userService.updateUser(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deactivateUser(id);
        return ResponseEntity.noContent().build();
    }
}
