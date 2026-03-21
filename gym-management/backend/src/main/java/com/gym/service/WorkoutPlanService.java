package com.gym.service;

import com.gym.dto.*;
import com.gym.entity.*;
import com.gym.repository.*;
import com.gym.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class WorkoutPlanService {

    private final WorkoutPlanRepository workoutPlanRepository;
    private final PersonalTrainingRepository personalTrainingRepository;
    private final UserRepository userRepository;
    private final WorkoutPlanProgressRepository progressRepository;
    private final NotificationService notificationService;

    @Transactional
    public WorkoutPlanDTO createPlan(CreateWorkoutPlanRequest request, Long createdById) {
        // Validate personal training exists
        PersonalTraining pt = personalTrainingRepository.findById(request.getPersonalTrainingId())
            .orElseThrow(() -> new ResourceNotFoundException("Personal training not found with ID: " + request.getPersonalTrainingId()));

        // Get creator
        User creator = userRepository.findById(createdById)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + createdById));

        // If setting as active, deactivate other plans
        if (Boolean.TRUE.equals(request.getIsActive())) {
            workoutPlanRepository.deactivateAllPlansForPersonalTraining(request.getPersonalTrainingId());
        }

        // Create workout plan
        WorkoutPlan plan = WorkoutPlan.builder()
                .personalTraining(pt)
                .planName(request.getPlanName())
                .planData(request.getPlanData())
                .isActive(request.getIsActive())
                .createdBy(creator)
                .build();

        WorkoutPlan saved = workoutPlanRepository.save(plan);

        // Send notification if activated
        if (Boolean.TRUE.equals(request.getIsActive())) {
            notificationService.createAndSendNotification(
                pt.getUser(),
                "NEW_WORKOUT_PLAN",
                "New Workout Plan Assigned",
                "Your trainer has created a new workout plan: " + request.getPlanName()
            );
        }

        log.info("Created workout plan '{}' for user {}", request.getPlanName(), pt.getUser().getName());

        return convertToDTO(saved);
    }

    @Transactional
    public WorkoutPlanDTO updatePlan(Long planId, CreateWorkoutPlanRequest request) {
        WorkoutPlan plan = workoutPlanRepository.findById(planId)
            .orElseThrow(() -> new ResourceNotFoundException("Workout plan not found with ID: " + planId));

        // If activating, deactivate others
        if (Boolean.TRUE.equals(request.getIsActive()) && !plan.getIsActive()) {
            workoutPlanRepository.deactivateAllPlansForPersonalTraining(plan.getPersonalTraining().getId());

            // Send notification
            notificationService.createAndSendNotification(
                plan.getPersonalTraining().getUser(),
                "WORKOUT_PLAN_UPDATED",
                "Workout Plan Updated",
                "Your workout plan '" + request.getPlanName() + "' has been updated and activated."
            );
        }

        plan.setPlanName(request.getPlanName());
        plan.setPlanData(request.getPlanData());
        plan.setIsActive(request.getIsActive());

        WorkoutPlan updated = workoutPlanRepository.save(plan);
        log.info("Updated workout plan ID: {}", planId);

        return convertToDTO(updated);
    }

    @Transactional
    public WorkoutPlanDTO duplicatePlan(Long planId, Long targetPtId) {
        // Get source plan
        WorkoutPlan sourcePlan = workoutPlanRepository.findById(planId)
            .orElseThrow(() -> new ResourceNotFoundException("Workout plan not found with ID: " + planId));

        // Get target personal training
        PersonalTraining targetPt = personalTrainingRepository.findById(targetPtId)
            .orElseThrow(() -> new ResourceNotFoundException("Personal training not found with ID: " + targetPtId));

        // Create duplicate
        WorkoutPlan duplicate = WorkoutPlan.builder()
                .personalTraining(targetPt)
                .planName(sourcePlan.getPlanName() + " (Copy)")
                .planData(sourcePlan.getPlanData())
                .isActive(false)
                .createdBy(sourcePlan.getCreatedBy())
                .build();

        WorkoutPlan saved = workoutPlanRepository.save(duplicate);
        log.info("Duplicated workout plan {} to user {}", planId, targetPt.getUser().getName());

        return convertToDTO(saved);
    }

    @Transactional
    public void activatePlan(Long planId) {
        WorkoutPlan plan = workoutPlanRepository.findById(planId)
            .orElseThrow(() -> new ResourceNotFoundException("Workout plan not found with ID: " + planId));

        // Deactivate all other plans for this user
        workoutPlanRepository.deactivateAllPlansForPersonalTraining(plan.getPersonalTraining().getId());

        // Activate this plan
        plan.setIsActive(true);
        workoutPlanRepository.save(plan);

        // Notify user
        notificationService.createAndSendNotification(
            plan.getPersonalTraining().getUser(),
            "WORKOUT_PLAN_ACTIVATED",
            "Workout Plan Activated",
            "Your workout plan '" + plan.getPlanName() + "' is now active!"
        );

        log.info("Activated workout plan ID: {}", planId);
    }

    @Transactional
    public void deactivatePlan(Long planId) {
        WorkoutPlan plan = workoutPlanRepository.findById(planId)
            .orElseThrow(() -> new ResourceNotFoundException("Workout plan not found with ID: " + planId));

        plan.setIsActive(false);
        workoutPlanRepository.save(plan);

        log.info("Deactivated workout plan ID: {}", planId);
    }

    @Transactional
    public void deletePlan(Long planId) {
        WorkoutPlan plan = workoutPlanRepository.findById(planId)
            .orElseThrow(() -> new ResourceNotFoundException("Workout plan not found with ID: " + planId));

        workoutPlanRepository.delete(plan);
        log.info("Deleted workout plan ID: {}", planId);
    }

    @Transactional(readOnly = true)
    public WorkoutPlanDTO getPlanById(Long planId) {
        WorkoutPlan plan = workoutPlanRepository.findById(planId)
            .orElseThrow(() -> new ResourceNotFoundException("Workout plan not found with ID: " + planId));
        return convertToDTO(plan);
    }

    @Transactional(readOnly = true)
    public List<WorkoutPlanDTO> getPlansByPersonalTrainingId(Long ptId) {
        return workoutPlanRepository.findByPersonalTrainingIdOrderByCreatedAtDesc(ptId)
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public WorkoutPlanDTO getActivePlanByUserId(Long userId) {
        WorkoutPlan plan = workoutPlanRepository.findActiveByUserId(userId)
            .orElseThrow(() -> new ResourceNotFoundException("No active workout plan found for user ID: " + userId));
        return convertToDTO(plan);
    }

    @Transactional
    public WorkoutPlanProgressDTO markExerciseComplete(MarkExerciseCompleteRequest request, Long userId) {
        // Validate workout plan exists
        WorkoutPlan plan = workoutPlanRepository.findById(request.getWorkoutPlanId())
            .orElseThrow(() -> new ResourceNotFoundException("Workout plan not found with ID: " + request.getWorkoutPlanId()));

        // Validate user
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        // Verify that this user is the one assigned to this workout plan
        if (!plan.getPersonalTraining().getUser().getId().equals(userId)) {
            throw new IllegalStateException("This workout plan is not assigned to the current user");
        }

        // Create progress record
        WorkoutPlanProgress progress = WorkoutPlanProgress.builder()
                .workoutPlan(plan)
                .user(user)
                .dayNumber(request.getDayNumber())
                .exerciseId(request.getExerciseId())
                .notes(request.getNotes())
                .build();

        WorkoutPlanProgress saved = progressRepository.save(progress);
        log.info("User {} marked exercise {} as complete", user.getName(), request.getExerciseId());

        return convertProgressToDTO(saved);
    }

    @Transactional(readOnly = true)
    public List<WorkoutPlanProgressDTO> getProgressByWorkoutPlan(Long workoutPlanId, Long userId) {
        // Verify workout plan exists
        WorkoutPlan plan = workoutPlanRepository.findById(workoutPlanId)
            .orElseThrow(() -> new ResourceNotFoundException("Workout plan not found with ID: " + workoutPlanId));

        // Verify user has access to this plan
        if (!plan.getPersonalTraining().getUser().getId().equals(userId)) {
            throw new IllegalStateException("This workout plan is not assigned to the current user");
        }

        return progressRepository.findByWorkoutPlanIdAndUserId(workoutPlanId, userId)
            .stream()
            .map(this::convertProgressToDTO)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<WorkoutPlanProgressDTO> getProgressByUserId(Long userId) {
        return progressRepository.findByUserIdOrderByCompletedAtDesc(userId)
            .stream()
            .map(this::convertProgressToDTO)
            .collect(Collectors.toList());
    }

    private WorkoutPlanDTO convertToDTO(WorkoutPlan plan) {
        WorkoutPlanDTO dto = new WorkoutPlanDTO();
        dto.setId(plan.getId());
        dto.setPersonalTrainingId(plan.getPersonalTraining().getId());
        dto.setUserId(plan.getPersonalTraining().getUser().getId());
        dto.setUserName(plan.getPersonalTraining().getUser().getName());
        dto.setPlanName(plan.getPlanName());
        dto.setPlanData(plan.getPlanData());
        dto.setIsActive(plan.getIsActive());
        dto.setCreatedById(plan.getCreatedBy().getId());
        dto.setCreatedByName(plan.getCreatedBy().getName());
        dto.setCreatedAt(plan.getCreatedAt());
        dto.setUpdatedAt(plan.getUpdatedAt());
        return dto;
    }

    private WorkoutPlanProgressDTO convertProgressToDTO(WorkoutPlanProgress progress) {
        WorkoutPlanProgressDTO dto = new WorkoutPlanProgressDTO();
        dto.setId(progress.getId());
        dto.setWorkoutPlanId(progress.getWorkoutPlan().getId());
        dto.setUserId(progress.getUser().getId());
        dto.setDayNumber(progress.getDayNumber());
        dto.setExerciseId(progress.getExerciseId());
        dto.setCompletedAt(progress.getCompletedAt());
        dto.setNotes(progress.getNotes());
        return dto;
    }
}
