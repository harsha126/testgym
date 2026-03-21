package com.gym.service;

import com.gym.dto.*;
import com.gym.entity.*;
import com.gym.repository.*;
import com.gym.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PersonalTrainingService {

    private final PersonalTrainingRepository personalTrainingRepository;
    private final UserRepository userRepository;
    private final WorkoutPlanRepository workoutPlanRepository;
    private final NotificationService notificationService;

    @Transactional
    public PersonalTrainingDTO enrollUser(EnrollPersonalTrainingRequest request) {
        // Validate user exists
        User user = userRepository.findById(request.getUserId())
            .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + request.getUserId()));

        // Check if already enrolled
        if (personalTrainingRepository.existsByUserId(request.getUserId())) {
            throw new IllegalStateException("User is already enrolled in personal training");
        }

        // Validate custom frequency
        if ("CUSTOM".equals(request.getPaymentFrequency()) && request.getCustomFrequencyDays() == null) {
            throw new IllegalArgumentException("Custom frequency days must be provided for CUSTOM payment frequency");
        }

        // Create personal training record
        PersonalTraining pt = PersonalTraining.builder()
                .user(user)
                .enrollmentDate(request.getEnrollmentDate() != null ? request.getEnrollmentDate() : LocalDate.now())
                .extraPaymentAmount(request.getExtraPaymentAmount())
                .paymentFrequency(request.getPaymentFrequency())
                .customFrequencyDays(request.getCustomFrequencyDays())
                .isActive(true)
                .notes(request.getNotes())
                .build();

        PersonalTraining saved = personalTrainingRepository.save(pt);

        // Update user's personal training flag
        user.setIsPersonalTraining(true);
        userRepository.save(user);

        // Send notification to user
        notificationService.createAndSendNotification(
            user,
            "PT_ENROLLMENT",
            "Personal Training Enrollment",
            "You have been enrolled in Personal Training! Your trainer will create a customized workout plan for you soon."
        );

        log.info("User {} enrolled in personal training", user.getName());

        return convertToDTO(saved);
    }

    @Transactional
    public void removeUser(Long userId) {
        PersonalTraining pt = personalTrainingRepository.findByUserId(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Personal training enrollment not found for user ID: " + userId));

        User user = pt.getUser();

        // Deactivate personal training
        pt.setIsActive(false);
        personalTrainingRepository.save(pt);

        // Update user flag
        user.setIsPersonalTraining(false);
        userRepository.save(user);

        // Send notification
        notificationService.createAndSendNotification(
            user,
            "PT_REMOVAL",
            "Personal Training Status Changed",
            "Your personal training enrollment has been deactivated."
        );

        log.info("User {} removed from personal training", user.getName());
    }

    @Transactional(readOnly = true)
    public List<PersonalTrainingDTO> getAllActiveUsers() {
        return personalTrainingRepository.findAllActiveWithUsers()
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PersonalTrainingDTO> getAllUsers() {
        return personalTrainingRepository.findAllWithUsers()
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PersonalTrainingDTO getByUserId(Long userId) {
        PersonalTraining pt = personalTrainingRepository.findByUserId(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Personal training enrollment not found for user ID: " + userId));
        return convertToDTO(pt);
    }

    @Transactional(readOnly = true)
    public PersonalTrainingDTO getById(Long ptId) {
        PersonalTraining pt = personalTrainingRepository.findById(ptId)
            .orElseThrow(() -> new ResourceNotFoundException("Personal training not found with ID: " + ptId));
        return convertToDTO(pt);
    }

    @Transactional
    public PersonalTrainingDTO updatePayment(Long ptId, BigDecimal amount, String frequency, Integer customDays) {
        PersonalTraining pt = personalTrainingRepository.findById(ptId)
            .orElseThrow(() -> new ResourceNotFoundException("Personal training not found with ID: " + ptId));

        if (amount != null) {
            pt.setExtraPaymentAmount(amount);
        }
        if (frequency != null) {
            // Validate frequency
            if (!frequency.matches("MONTHLY|QUARTERLY|HALF_YEARLY|YEARLY|CUSTOM")) {
                throw new IllegalArgumentException("Invalid payment frequency: " + frequency);
            }
            pt.setPaymentFrequency(frequency);
        }
        if (customDays != null) {
            pt.setCustomFrequencyDays(customDays);
        }

        // Validate custom frequency if needed
        if ("CUSTOM".equals(pt.getPaymentFrequency()) && pt.getCustomFrequencyDays() == null) {
            throw new IllegalArgumentException("Custom frequency days must be provided for CUSTOM payment frequency");
        }

        PersonalTraining updated = personalTrainingRepository.save(pt);
        log.info("Updated payment details for personal training ID: {}", ptId);

        return convertToDTO(updated);
    }

    @Transactional
    public PersonalTrainingDTO updateNotes(Long ptId, String notes) {
        PersonalTraining pt = personalTrainingRepository.findById(ptId)
            .orElseThrow(() -> new ResourceNotFoundException("Personal training not found with ID: " + ptId));

        pt.setNotes(notes);
        PersonalTraining updated = personalTrainingRepository.save(pt);
        log.info("Updated notes for personal training ID: {}", ptId);

        return convertToDTO(updated);
    }

    private PersonalTrainingDTO convertToDTO(PersonalTraining pt) {
        PersonalTrainingDTO dto = new PersonalTrainingDTO();
        dto.setId(pt.getId());
        dto.setUserId(pt.getUser().getId());
        dto.setUserName(pt.getUser().getName());
        dto.setUserPhone(pt.getUser().getPhone());
        dto.setEnrollmentDate(pt.getEnrollmentDate());
        dto.setExtraPaymentAmount(pt.getExtraPaymentAmount());
        dto.setPaymentFrequency(pt.getPaymentFrequency());
        dto.setCustomFrequencyDays(pt.getCustomFrequencyDays());
        dto.setIsActive(pt.getIsActive());
        dto.setNotes(pt.getNotes());
        dto.setCreatedAt(pt.getCreatedAt());
        dto.setUpdatedAt(pt.getUpdatedAt());

        // Count active workout plans
        int activeCount = (int) workoutPlanRepository.findByPersonalTrainingId(pt.getId())
            .stream()
            .filter(WorkoutPlan::getIsActive)
            .count();
        dto.setActiveWorkoutPlansCount(activeCount);

        return dto;
    }
}
