package com.gym.controller;

import com.gym.dto.*;
import com.gym.entity.User;
import com.gym.service.WorkoutPlanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/workout-plans")
@RequiredArgsConstructor
public class WorkoutPlanController {

    private final WorkoutPlanService workoutPlanService;

    /**
     * Create a new workout plan (OWNER only)
     */
    @PostMapping
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<WorkoutPlanDTO> createPlan(
            @Valid @RequestBody CreateWorkoutPlanRequest request,
            @AuthenticationPrincipal User currentUser) {

        WorkoutPlanDTO result = workoutPlanService.createPlan(request, currentUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    /**
     * Update an existing workout plan (OWNER only)
     */
    @PutMapping("/{planId}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<WorkoutPlanDTO> updatePlan(
            @PathVariable Long planId,
            @Valid @RequestBody CreateWorkoutPlanRequest request) {

        WorkoutPlanDTO updated = workoutPlanService.updatePlan(planId, request);
        return ResponseEntity.ok(updated);
    }

    /**
     * Duplicate a workout plan to another user (OWNER only)
     */
    @PostMapping("/{planId}/duplicate")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<WorkoutPlanDTO> duplicatePlan(
            @PathVariable Long planId,
            @RequestParam Long targetPtId) {

        WorkoutPlanDTO duplicated = workoutPlanService.duplicatePlan(planId, targetPtId);
        return ResponseEntity.status(HttpStatus.CREATED).body(duplicated);
    }

    /**
     * Activate a workout plan (OWNER only)
     */
    @PatchMapping("/{planId}/activate")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<Void> activatePlan(@PathVariable Long planId) {
        workoutPlanService.activatePlan(planId);
        return ResponseEntity.ok().build();
    }

    /**
     * Deactivate a workout plan (OWNER only)
     */
    @PatchMapping("/{planId}/deactivate")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<Void> deactivatePlan(@PathVariable Long planId) {
        workoutPlanService.deactivatePlan(planId);
        return ResponseEntity.ok().build();
    }

    /**
     * Delete a workout plan (OWNER only)
     */
    @DeleteMapping("/{planId}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<Void> deletePlan(@PathVariable Long planId) {
        workoutPlanService.deletePlan(planId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Get a workout plan by ID (OWNER only)
     */
    @GetMapping("/{planId}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<WorkoutPlanDTO> getPlanById(@PathVariable Long planId) {
        WorkoutPlanDTO plan = workoutPlanService.getPlanById(planId);
        return ResponseEntity.ok(plan);
    }

    /**
     * Get all workout plans for a personal training enrollment (OWNER only)
     */
    @GetMapping("/personal-training/{ptId}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<List<WorkoutPlanDTO>> getPlansByPersonalTrainingId(@PathVariable Long ptId) {
        List<WorkoutPlanDTO> plans = workoutPlanService.getPlansByPersonalTrainingId(ptId);
        return ResponseEntity.ok(plans);
    }

    /**
     * Get the active workout plan for a user
     * OWNER can view any user, USER can only view their own
     */
    @GetMapping("/users/{userId}/active")
    public ResponseEntity<WorkoutPlanDTO> getActivePlanByUserId(
            @PathVariable Long userId,
            @AuthenticationPrincipal User currentUser) {

        // Check authorization: USER can only view their own data
        if (currentUser.getRole() == User.Role.USER && !currentUser.getId().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        WorkoutPlanDTO plan = workoutPlanService.getActivePlanByUserId(userId);
        return ResponseEntity.ok(plan);
    }

    /**
     * Mark an exercise as complete
     * Only the user assigned to the workout plan can mark exercises complete
     */
    @PostMapping("/progress")
    public ResponseEntity<WorkoutPlanProgressDTO> markExerciseComplete(
            @Valid @RequestBody MarkExerciseCompleteRequest request,
            @AuthenticationPrincipal User currentUser) {

        WorkoutPlanProgressDTO progress = workoutPlanService.markExerciseComplete(request, currentUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(progress);
    }

    /**
     * Get progress for a workout plan
     * OWNER can view any plan, USER can only view their own
     */
    @GetMapping("/{workoutPlanId}/progress")
    public ResponseEntity<List<WorkoutPlanProgressDTO>> getProgress(
            @PathVariable Long workoutPlanId,
            @AuthenticationPrincipal User currentUser) {

        // For users, service will verify they have access to this plan
        List<WorkoutPlanProgressDTO> progress = workoutPlanService.getProgressByWorkoutPlan(
            workoutPlanId,
            currentUser.getId()
        );
        return ResponseEntity.ok(progress);
    }

    /**
     * Get all progress for the current user
     */
    @GetMapping("/progress/me")
    public ResponseEntity<List<WorkoutPlanProgressDTO>> getMyProgress(
            @AuthenticationPrincipal User currentUser) {

        List<WorkoutPlanProgressDTO> progress = workoutPlanService.getProgressByUserId(currentUser.getId());
        return ResponseEntity.ok(progress);
    }
}
