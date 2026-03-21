package com.gym.controller;

import com.gym.dto.*;
import com.gym.entity.User;
import com.gym.service.PersonalTrainingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/personal-training")
@RequiredArgsConstructor
public class PersonalTrainingController {

    private final PersonalTrainingService personalTrainingService;

    /**
     * Enroll a user in personal training (OWNER only)
     */
    @PostMapping("/enroll")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<PersonalTrainingDTO> enrollUser(@Valid @RequestBody EnrollPersonalTrainingRequest request) {
        PersonalTrainingDTO result = personalTrainingService.enrollUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    /**
     * Remove a user from personal training (OWNER only)
     */
    @DeleteMapping("/users/{userId}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<Void> removeUser(@PathVariable Long userId) {
        personalTrainingService.removeUser(userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Get all active personal training users (OWNER only)
     */
    @GetMapping("/users")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<List<PersonalTrainingDTO>> getAllActiveUsers() {
        List<PersonalTrainingDTO> users = personalTrainingService.getAllActiveUsers();
        return ResponseEntity.ok(users);
    }

    /**
     * Get all personal training users including inactive (OWNER only)
     */
    @GetMapping("/users/all")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<List<PersonalTrainingDTO>> getAllUsers() {
        List<PersonalTrainingDTO> users = personalTrainingService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    /**
     * Get personal training details by user ID
     * OWNER can view any user, USER can only view their own
     */
    @GetMapping("/users/{userId}")
    public ResponseEntity<PersonalTrainingDTO> getByUserId(
            @PathVariable Long userId,
            @AuthenticationPrincipal User currentUser) {

        // Check authorization: USER can only view their own data
        if (currentUser.getRole() == User.Role.USER && !currentUser.getId().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        PersonalTrainingDTO pt = personalTrainingService.getByUserId(userId);
        return ResponseEntity.ok(pt);
    }

    /**
     * Get personal training details by PT ID (OWNER only)
     */
    @GetMapping("/{ptId}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<PersonalTrainingDTO> getById(@PathVariable Long ptId) {
        PersonalTrainingDTO pt = personalTrainingService.getById(ptId);
        return ResponseEntity.ok(pt);
    }

    /**
     * Update payment details for personal training (OWNER only)
     */
    @PatchMapping("/{ptId}/payment")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<PersonalTrainingDTO> updatePayment(
            @PathVariable Long ptId,
            @RequestParam(required = false) BigDecimal amount,
            @RequestParam(required = false) String frequency,
            @RequestParam(required = false) Integer customDays) {

        PersonalTrainingDTO updated = personalTrainingService.updatePayment(ptId, amount, frequency, customDays);
        return ResponseEntity.ok(updated);
    }

    /**
     * Update notes for personal training (OWNER only)
     */
    @PatchMapping("/{ptId}/notes")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<PersonalTrainingDTO> updateNotes(
            @PathVariable Long ptId,
            @RequestParam String notes) {

        PersonalTrainingDTO updated = personalTrainingService.updateNotes(ptId, notes);
        return ResponseEntity.ok(updated);
    }
}
