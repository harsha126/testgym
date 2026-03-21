---
name: Personal Training Feature - Phase 2
overview: Add comprehensive personal training functionality to the gym management app, allowing owners to enroll users in personal training, create personalized workout plans with detailed exercise schedules, and enable users to track their progress.
parent_plan: gym_management_app_0f218ad0.plan.md
---

# Personal Training Feature - Phase 2 Implementation Plan

## Feature Overview

This phase adds a **Personal Training** system that enables:
- **Owner**: Promote users to personal training with extra payment tracking
- **Owner**: Create detailed, personalized workout plans for each PT user
- **Owner**: Manage multiple workout plans per user (activate one at a time)
- **Owner**: Duplicate/copy workout plans between users
- **Users**: View their active workout plan (read-only structure, can mark exercises complete)
- **Diet Plan**: Placeholder for future implementation ("Coming Soon" modal)

---

## Implementation Phases

### Phase 1: Database Schema & Backend Entities
### Phase 2: Backend Services & APIs
### Phase 3: Frontend State Management & API Layer
### Phase 4: Owner UI - PT Management
### Phase 5: Owner UI - Workout Plan Builder
### Phase 6: User UI - View Workout Plans
### Phase 7: Notifications & Polish

---

## Database Schema Design

### 1.1 Update Users Table

**Migration**: `V3__add_personal_training_support.sql`

```sql
-- Add personal training flag to users table
ALTER TABLE users ADD COLUMN is_personal_training BOOLEAN DEFAULT FALSE;

-- Add index for quick PT user lookup
CREATE INDEX idx_users_is_personal_training ON users(is_personal_training) WHERE is_personal_training = true;
```

### 1.2 Create Personal Training Table

```sql
-- Personal training enrollment details
CREATE TABLE personal_training (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    extra_payment_amount DECIMAL(10,2) NOT NULL,
    payment_frequency VARCHAR(50) NOT NULL, -- MONTHLY, QUARTERLY, HALF_YEARLY, YEARLY, CUSTOM
    custom_frequency_days INT,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_pt_user_id ON personal_training(user_id);
CREATE INDEX idx_pt_is_active ON personal_training(is_active);
```

### 1.3 Create Workout Plans Table

```sql
-- Workout plans for personal training users
CREATE TABLE workout_plans (
    id BIGSERIAL PRIMARY KEY,
    personal_training_id BIGINT NOT NULL,
    plan_name VARCHAR(255) NOT NULL,
    plan_data JSONB NOT NULL, -- Stores complete workout plan structure
    is_active BOOLEAN DEFAULT FALSE,
    created_by BIGINT NOT NULL, -- Owner who created the plan
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_wp_personal_training FOREIGN KEY (personal_training_id) REFERENCES personal_training(id) ON DELETE CASCADE,
    CONSTRAINT fk_wp_created_by FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_wp_pt_id ON workout_plans(personal_training_id);
CREATE INDEX idx_wp_is_active ON workout_plans(is_active);
CREATE INDEX idx_wp_user_active ON workout_plans(personal_training_id, is_active);
```

### 1.4 Create Workout Plan Progress Table

```sql
-- Track user progress on exercises
CREATE TABLE workout_plan_progress (
    id BIGSERIAL PRIMARY KEY,
    workout_plan_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    day_number INT NOT NULL,
    exercise_id VARCHAR(100) NOT NULL, -- References exercise ID in JSON
    completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    CONSTRAINT fk_wpp_workout_plan FOREIGN KEY (workout_plan_id) REFERENCES workout_plans(id) ON DELETE CASCADE,
    CONSTRAINT fk_wpp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_wpp_workout_plan_id ON workout_plan_progress(workout_plan_id);
CREATE INDEX idx_wpp_user_id ON workout_plan_progress(user_id);
CREATE INDEX idx_wpp_completed_at ON workout_plan_progress(completed_at);
```

---

## Workout Plan JSON Structure

The `plan_data` JSONB column stores the complete workout plan in the following structure:

```json
{
  "planName": "Beginner Strength Training - Week 1",
  "description": "4-week beginner program focusing on compound movements",
  "totalWeeks": 4,
  "daysPerWeek": 3,
  "selectedDays": ["Monday", "Wednesday", "Friday"],
  "startDate": "2026-03-15",
  "endDate": "2026-04-12",
  "days": [
    {
      "dayNumber": 1,
      "dayName": "Monday",
      "focusArea": "Chest & Triceps",
      "exercises": [
        {
          "id": "ex1_day1",
          "name": "Bench Press",
          "sets": 4,
          "reps": "8-10",
          "weight": "60kg",
          "restTime": "90 seconds",
          "notes": "Focus on controlled motion, full range",
          "order": 1,
          "videoUrl": ""
        },
        {
          "id": "ex2_day1",
          "name": "Incline Dumbbell Press",
          "sets": 3,
          "reps": "10-12",
          "weight": "20kg each",
          "restTime": "60 seconds",
          "notes": "45-degree angle",
          "order": 2,
          "videoUrl": ""
        },
        {
          "id": "ex3_day1",
          "name": "Tricep Dips",
          "sets": 3,
          "reps": "12-15",
          "weight": "Bodyweight",
          "restTime": "60 seconds",
          "notes": "Use assisted machine if needed",
          "order": 3,
          "videoUrl": ""
        },
        {
          "id": "ex4_day1",
          "name": "Tricep Pushdowns",
          "sets": 3,
          "reps": "12-15",
          "weight": "15kg",
          "restTime": "45 seconds",
          "notes": "Keep elbows stationary",
          "order": 4,
          "videoUrl": ""
        }
      ]
    },
    {
      "dayNumber": 2,
      "dayName": "Wednesday",
      "focusArea": "Back & Biceps",
      "exercises": [
        {
          "id": "ex1_day2",
          "name": "Deadlifts",
          "sets": 4,
          "reps": "6-8",
          "weight": "80kg",
          "restTime": "120 seconds",
          "notes": "Maintain neutral spine",
          "order": 1,
          "videoUrl": ""
        },
        {
          "id": "ex2_day2",
          "name": "Pull-ups",
          "sets": 3,
          "reps": "8-10",
          "weight": "Bodyweight",
          "restTime": "90 seconds",
          "notes": "Assisted if needed",
          "order": 2,
          "videoUrl": ""
        },
        {
          "id": "ex3_day2",
          "name": "Barbell Rows",
          "sets": 3,
          "reps": "10-12",
          "weight": "50kg",
          "restTime": "60 seconds",
          "notes": "Pull to lower chest",
          "order": 3,
          "videoUrl": ""
        },
        {
          "id": "ex4_day2",
          "name": "Bicep Curls",
          "sets": 3,
          "reps": "12-15",
          "weight": "12kg each",
          "restTime": "45 seconds",
          "notes": "Controlled tempo",
          "order": 4,
          "videoUrl": ""
        }
      ]
    },
    {
      "dayNumber": 3,
      "dayName": "Friday",
      "focusArea": "Legs & Shoulders",
      "exercises": [
        {
          "id": "ex1_day3",
          "name": "Squats",
          "sets": 4,
          "reps": "8-10",
          "weight": "70kg",
          "restTime": "120 seconds",
          "notes": "Depth to parallel or below",
          "order": 1,
          "videoUrl": ""
        },
        {
          "id": "ex2_day3",
          "name": "Leg Press",
          "sets": 3,
          "reps": "10-12",
          "weight": "100kg",
          "restTime": "90 seconds",
          "notes": "Full range of motion",
          "order": 2,
          "videoUrl": ""
        },
        {
          "id": "ex3_day3",
          "name": "Shoulder Press",
          "sets": 3,
          "reps": "10-12",
          "weight": "15kg each",
          "restTime": "60 seconds",
          "notes": "Seated or standing",
          "order": 3,
          "videoUrl": ""
        },
        {
          "id": "ex4_day3",
          "name": "Lateral Raises",
          "sets": 3,
          "reps": "12-15",
          "weight": "8kg each",
          "restTime": "45 seconds",
          "notes": "Slight bend in elbows",
          "order": 4,
          "videoUrl": ""
        }
      ]
    }
  ],
  "generalNotes": "Warm up 5-10 minutes before each session. Cool down and stretch after. Increase weight by 2.5-5kg when you can complete all sets with good form.",
  "metadata": {
    "difficulty": "Beginner",
    "equipment": ["Barbell", "Dumbbells", "Machines"],
    "tags": ["Strength", "Hypertrophy", "Compound"]
  }
}
```

---

## Backend Implementation

### 2.1 Entity Classes

#### PersonalTraining.java

```java
package com.gym.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "personal_training")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PersonalTraining {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "enrollment_date", nullable = false)
    private LocalDate enrollmentDate;

    @Column(name = "extra_payment_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal extraPaymentAmount;

    @Column(name = "payment_frequency", nullable = false, length = 50)
    private String paymentFrequency; // MONTHLY, QUARTERLY, HALF_YEARLY, YEARLY, CUSTOM

    @Column(name = "custom_frequency_days")
    private Integer customFrequencyDays;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "personalTraining", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<WorkoutPlan> workoutPlans;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (enrollmentDate == null) {
            enrollmentDate = LocalDate.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
```

#### WorkoutPlan.java

```java
package com.gym.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Type;
import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "workout_plans")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkoutPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "personal_training_id", nullable = false)
    private PersonalTraining personalTraining;

    @Column(name = "plan_name", nullable = false)
    private String planName;

    @Type(JsonBinaryType.class)
    @Column(name = "plan_data", columnDefinition = "jsonb", nullable = false)
    private Map<String, Object> planData;

    @Column(name = "is_active")
    private Boolean isActive = false;

    @ManyToOne
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
```

#### WorkoutPlanProgress.java

```java
package com.gym.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "workout_plan_progress")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkoutPlanProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "workout_plan_id", nullable = false)
    private WorkoutPlan workoutPlan;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "day_number", nullable = false)
    private Integer dayNumber;

    @Column(name = "exercise_id", nullable = false, length = 100)
    private String exerciseId;

    @Column(name = "completed_at", nullable = false)
    private LocalDateTime completedAt;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @PrePersist
    protected void onCreate() {
        if (completedAt == null) {
            completedAt = LocalDateTime.now();
        }
    }
}
```

#### Update User.java

```java
// Add to User entity
@Column(name = "is_personal_training")
private Boolean isPersonalTraining = false;

@OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
private PersonalTraining personalTraining;
```

### 2.2 DTOs

#### PersonalTrainingDTO.java

```java
package com.gym.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PersonalTrainingDTO {
    private Long id;
    private Long userId;
    private String userName;
    private String userPhone;
    private LocalDate enrollmentDate;
    private BigDecimal extraPaymentAmount;
    private String paymentFrequency;
    private Integer customFrequencyDays;
    private Boolean isActive;
    private String notes;
    private Integer activeWorkoutPlansCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

#### EnrollPersonalTrainingRequest.java

```java
package com.gym.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class EnrollPersonalTrainingRequest {

    @NotNull(message = "User ID is required")
    private Long userId;

    private LocalDate enrollmentDate;

    @NotNull(message = "Extra payment amount is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Payment amount must be positive")
    private BigDecimal extraPaymentAmount;

    @NotBlank(message = "Payment frequency is required")
    @Pattern(regexp = "MONTHLY|QUARTERLY|HALF_YEARLY|YEARLY|CUSTOM",
             message = "Invalid payment frequency")
    private String paymentFrequency;

    private Integer customFrequencyDays;

    private String notes;
}
```

#### WorkoutPlanDTO.java

```java
package com.gym.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkoutPlanDTO {
    private Long id;
    private Long personalTrainingId;
    private Long userId;
    private String userName;
    private String planName;
    private Map<String, Object> planData;
    private Boolean isActive;
    private Long createdById;
    private String createdByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

#### CreateWorkoutPlanRequest.java

```java
package com.gym.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.util.Map;

@Data
public class CreateWorkoutPlanRequest {

    @NotNull(message = "Personal Training ID is required")
    private Long personalTrainingId;

    @NotBlank(message = "Plan name is required")
    @Size(max = 255, message = "Plan name cannot exceed 255 characters")
    private String planName;

    @NotNull(message = "Plan data is required")
    private Map<String, Object> planData;

    private Boolean isActive = false;
}
```

#### WorkoutPlanProgressDTO.java

```java
package com.gym.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkoutPlanProgressDTO {
    private Long id;
    private Long workoutPlanId;
    private Long userId;
    private Integer dayNumber;
    private String exerciseId;
    private LocalDateTime completedAt;
    private String notes;
}
```

#### MarkExerciseCompleteRequest.java

```java
package com.gym.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class MarkExerciseCompleteRequest {

    @NotNull(message = "Workout plan ID is required")
    private Long workoutPlanId;

    @NotNull(message = "Day number is required")
    @Min(value = 1, message = "Day number must be at least 1")
    private Integer dayNumber;

    @NotBlank(message = "Exercise ID is required")
    private String exerciseId;

    private String notes;
}
```

### 2.3 Repository Layer

#### PersonalTrainingRepository.java

```java
package com.gym.repository;

import com.gym.entity.PersonalTraining;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PersonalTrainingRepository extends JpaRepository<PersonalTraining, Long> {

    Optional<PersonalTraining> findByUserId(Long userId);

    List<PersonalTraining> findByIsActiveTrue();

    @Query("SELECT pt FROM PersonalTraining pt JOIN FETCH pt.user WHERE pt.isActive = true")
    List<PersonalTraining> findAllActiveWithUsers();

    boolean existsByUserId(Long userId);
}
```

#### WorkoutPlanRepository.java

```java
package com.gym.repository;

import com.gym.entity.WorkoutPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface WorkoutPlanRepository extends JpaRepository<WorkoutPlan, Long> {

    List<WorkoutPlan> findByPersonalTrainingId(Long personalTrainingId);

    List<WorkoutPlan> findByPersonalTrainingIdOrderByCreatedAtDesc(Long personalTrainingId);

    @Query("SELECT wp FROM WorkoutPlan wp WHERE wp.personalTraining.id = :ptId AND wp.isActive = true")
    Optional<WorkoutPlan> findActiveByPersonalTrainingId(@Param("ptId") Long personalTrainingId);

    @Query("SELECT wp FROM WorkoutPlan wp WHERE wp.personalTraining.user.id = :userId AND wp.isActive = true")
    Optional<WorkoutPlan> findActiveByUserId(@Param("userId") Long userId);

    @Modifying
    @Query("UPDATE WorkoutPlan wp SET wp.isActive = false WHERE wp.personalTraining.id = :ptId")
    void deactivateAllPlansForPersonalTraining(@Param("ptId") Long personalTrainingId);
}
```

#### WorkoutPlanProgressRepository.java

```java
package com.gym.repository;

import com.gym.entity.WorkoutPlanProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface WorkoutPlanProgressRepository extends JpaRepository<WorkoutPlanProgress, Long> {

    List<WorkoutPlanProgress> findByWorkoutPlanIdAndUserId(Long workoutPlanId, Long userId);

    List<WorkoutPlanProgress> findByUserIdOrderByCompletedAtDesc(Long userId);

    @Query("SELECT wpp FROM WorkoutPlanProgress wpp WHERE wpp.workoutPlan.id = :workoutPlanId " +
           "AND wpp.user.id = :userId AND wpp.dayNumber = :dayNumber AND wpp.exerciseId = :exerciseId")
    List<WorkoutPlanProgress> findByWorkoutPlanAndUserAndDayAndExercise(
        @Param("workoutPlanId") Long workoutPlanId,
        @Param("userId") Long userId,
        @Param("dayNumber") Integer dayNumber,
        @Param("exerciseId") String exerciseId
    );

    @Query("SELECT COUNT(wpp) FROM WorkoutPlanProgress wpp WHERE wpp.workoutPlan.id = :workoutPlanId " +
           "AND wpp.user.id = :userId")
    Long countCompletedExercises(@Param("workoutPlanId") Long workoutPlanId, @Param("userId") Long userId);
}
```

---

## Backend Services & Controllers

### 3.1 PersonalTrainingService.java

```java
package com.gym.service;

import com.gym.dto.*;
import com.gym.entity.*;
import com.gym.repository.*;
import com.gym.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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
        PersonalTraining pt = new PersonalTraining();
        pt.setUser(user);
        pt.setEnrollmentDate(request.getEnrollmentDate() != null ? request.getEnrollmentDate() : LocalDate.now());
        pt.setExtraPaymentAmount(request.getExtraPaymentAmount());
        pt.setPaymentFrequency(request.getPaymentFrequency());
        pt.setCustomFrequencyDays(request.getCustomFrequencyDays());
        pt.setIsActive(true);
        pt.setNotes(request.getNotes());

        PersonalTraining saved = personalTrainingRepository.save(pt);

        // Update user's personal training flag
        user.setIsPersonalTraining(true);
        userRepository.save(user);

        // Send notification to user
        notificationService.createNotification(
            user.getId(),
            "PT_ENROLLMENT",
            "Personal Training Enrollment",
            "You have been enrolled in Personal Training! Your trainer will create a customized workout plan for you soon.",
            "PUSH"
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
        notificationService.createNotification(
            user.getId(),
            "PT_REMOVAL",
            "Personal Training Status Changed",
            "Your personal training enrollment has been deactivated.",
            "PUSH"
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
    public PersonalTrainingDTO getByUserId(Long userId) {
        PersonalTraining pt = personalTrainingRepository.findByUserId(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Personal training enrollment not found for user ID: " + userId));
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
            pt.setPaymentFrequency(frequency);
        }
        if (customDays != null) {
            pt.setCustomFrequencyDays(customDays);
        }

        PersonalTraining updated = personalTrainingRepository.save(pt);
        log.info("Updated payment details for personal training ID: {}", ptId);

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
```

### 3.2 WorkoutPlanService.java

```java
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
        WorkoutPlan plan = new WorkoutPlan();
        plan.setPersonalTraining(pt);
        plan.setPlanName(request.getPlanName());
        plan.setPlanData(request.getPlanData());
        plan.setIsActive(request.getIsActive());
        plan.setCreatedBy(creator);

        WorkoutPlan saved = workoutPlanRepository.save(plan);

        // Send notification if activated
        if (Boolean.TRUE.equals(request.getIsActive())) {
            notificationService.createNotification(
                pt.getUser().getId(),
                "NEW_WORKOUT_PLAN",
                "New Workout Plan Assigned",
                "Your trainer has created a new workout plan: " + request.getPlanName(),
                "PUSH"
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
            notificationService.createNotification(
                plan.getPersonalTraining().getUser().getId(),
                "WORKOUT_PLAN_UPDATED",
                "Workout Plan Updated",
                "Your workout plan '" + request.getPlanName() + "' has been updated and activated.",
                "PUSH"
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
        WorkoutPlan duplicate = new WorkoutPlan();
        duplicate.setPersonalTraining(targetPt);
        duplicate.setPlanName(sourcePlan.getPlanName() + " (Copy)");
        duplicate.setPlanData(sourcePlan.getPlanData());
        duplicate.setIsActive(false);
        duplicate.setCreatedBy(sourcePlan.getCreatedBy());

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
        notificationService.createNotification(
            plan.getPersonalTraining().getUser().getId(),
            "WORKOUT_PLAN_ACTIVATED",
            "Workout Plan Activated",
            "Your workout plan '" + plan.getPlanName() + "' is now active!",
            "PUSH"
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

        // Create progress record
        WorkoutPlanProgress progress = new WorkoutPlanProgress();
        progress.setWorkoutPlan(plan);
        progress.setUser(user);
        progress.setDayNumber(request.getDayNumber());
        progress.setExerciseId(request.getExerciseId());
        progress.setNotes(request.getNotes());

        WorkoutPlanProgress saved = progressRepository.save(progress);
        log.info("User {} marked exercise {} as complete", user.getName(), request.getExerciseId());

        return convertProgressToDTO(saved);
    }

    @Transactional(readOnly = true)
    public List<WorkoutPlanProgressDTO> getProgressByWorkoutPlan(Long workoutPlanId, Long userId) {
        return progressRepository.findByWorkoutPlanIdAndUserId(workoutPlanId, userId)
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
```

### 3.3 Controllers

#### PersonalTrainingController.java

```java
package com.gym.controller;

import com.gym.dto.*;
import com.gym.service.PersonalTrainingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/personal-training")
@RequiredArgsConstructor
public class PersonalTrainingController {

    private final PersonalTrainingService personalTrainingService;

    @PostMapping("/enroll")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<PersonalTrainingDTO> enrollUser(@Valid @RequestBody EnrollPersonalTrainingRequest request) {
        PersonalTrainingDTO result = personalTrainingService.enrollUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @DeleteMapping("/users/{userId}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<Void> removeUser(@PathVariable Long userId) {
        personalTrainingService.removeUser(userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<List<PersonalTrainingDTO>> getAllActiveUsers() {
        List<PersonalTrainingDTO> users = personalTrainingService.getAllActiveUsers();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<PersonalTrainingDTO> getByUserId(@PathVariable Long userId, Authentication auth) {
        // Owner can view any user, regular user can only view self
        String role = auth.getAuthorities().stream()
            .findFirst()
            .map(a -> a.getAuthority())
            .orElse("");

        if (!"ROLE_OWNER".equals(role)) {
            // Validate user is viewing their own data
            Long authenticatedUserId = Long.parseLong(auth.getName());
            if (!userId.equals(authenticatedUserId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
        }

        PersonalTrainingDTO pt = personalTrainingService.getByUserId(userId);
        return ResponseEntity.ok(pt);
    }

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
}
```

#### WorkoutPlanController.java

```java
package com.gym.controller;

import com.gym.dto.*;
import com.gym.service.WorkoutPlanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/workout-plans")
@RequiredArgsConstructor
public class WorkoutPlanController {

    private final WorkoutPlanService workoutPlanService;

    @PostMapping
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<WorkoutPlanDTO> createPlan(
            @Valid @RequestBody CreateWorkoutPlanRequest request,
            Authentication auth) {
        Long createdById = Long.parseLong(auth.getName());
        WorkoutPlanDTO result = workoutPlanService.createPlan(request, createdById);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @PutMapping("/{planId}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<WorkoutPlanDTO> updatePlan(
            @PathVariable Long planId,
            @Valid @RequestBody CreateWorkoutPlanRequest request) {
        WorkoutPlanDTO updated = workoutPlanService.updatePlan(planId, request);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{planId}/duplicate")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<WorkoutPlanDTO> duplicatePlan(
            @PathVariable Long planId,
            @RequestParam Long targetPtId) {
        WorkoutPlanDTO duplicated = workoutPlanService.duplicatePlan(planId, targetPtId);
        return ResponseEntity.status(HttpStatus.CREATED).body(duplicated);
    }

    @PatchMapping("/{planId}/activate")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<Void> activatePlan(@PathVariable Long planId) {
        workoutPlanService.activatePlan(planId);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{planId}/deactivate")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<Void> deactivatePlan(@PathVariable Long planId) {
        workoutPlanService.deactivatePlan(planId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{planId}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<Void> deletePlan(@PathVariable Long planId) {
        workoutPlanService.deletePlan(planId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/personal-training/{ptId}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<List<WorkoutPlanDTO>> getPlansByPersonalTrainingId(@PathVariable Long ptId) {
        List<WorkoutPlanDTO> plans = workoutPlanService.getPlansByPersonalTrainingId(ptId);
        return ResponseEntity.ok(plans);
    }

    @GetMapping("/users/{userId}/active")
    public ResponseEntity<WorkoutPlanDTO> getActivePlanByUserId(
            @PathVariable Long userId,
            Authentication auth) {
        // Validate authorization
        String role = auth.getAuthorities().stream()
            .findFirst()
            .map(a -> a.getAuthority())
            .orElse("");

        if (!"ROLE_OWNER".equals(role)) {
            Long authenticatedUserId = Long.parseLong(auth.getName());
            if (!userId.equals(authenticatedUserId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
        }

        WorkoutPlanDTO plan = workoutPlanService.getActivePlanByUserId(userId);
        return ResponseEntity.ok(plan);
    }

    @PostMapping("/progress")
    public ResponseEntity<WorkoutPlanProgressDTO> markExerciseComplete(
            @Valid @RequestBody MarkExerciseCompleteRequest request,
            Authentication auth) {
        Long userId = Long.parseLong(auth.getName());
        WorkoutPlanProgressDTO progress = workoutPlanService.markExerciseComplete(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(progress);
    }

    @GetMapping("/{workoutPlanId}/progress")
    public ResponseEntity<List<WorkoutPlanProgressDTO>> getProgress(
            @PathVariable Long workoutPlanId,
            Authentication auth) {
        Long userId = Long.parseLong(auth.getName());
        List<WorkoutPlanProgressDTO> progress = workoutPlanService.getProgressByWorkoutPlan(workoutPlanId, userId);
        return ResponseEntity.ok(progress);
    }
}
```

---

## Frontend Implementation Plan

### 4.1 Type Definitions

**File**: `frontend/src/types/personalTraining.ts`

```typescript
export interface PersonalTraining {
  id: number;
  userId: number;
  userName: string;
  userPhone: string;
  enrollmentDate: string;
  extraPaymentAmount: number;
  paymentFrequency: 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'YEARLY' | 'CUSTOM';
  customFrequencyDays?: number;
  isActive: boolean;
  notes?: string;
  activeWorkoutPlansCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface EnrollPersonalTrainingRequest {
  userId: number;
  enrollmentDate?: string;
  extraPaymentAmount: number;
  paymentFrequency: string;
  customFrequencyDays?: number;
  notes?: string;
}

export interface WorkoutPlan {
  id: number;
  personalTrainingId: number;
  userId: number;
  userName: string;
  planName: string;
  planData: WorkoutPlanData;
  isActive: boolean;
  createdById: number;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutPlanData {
  planName: string;
  description?: string;
  totalWeeks: number;
  daysPerWeek: number;
  selectedDays: string[];
  startDate?: string;
  endDate?: string;
  days: WorkoutDay[];
  generalNotes?: string;
  metadata?: {
    difficulty?: string;
    equipment?: string[];
    tags?: string[];
  };
}

export interface WorkoutDay {
  dayNumber: number;
  dayName: string;
  focusArea: string;
  exercises: Exercise[];
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weight: string;
  restTime: string;
  notes?: string;
  order: number;
  videoUrl?: string;
}

export interface CreateWorkoutPlanRequest {
  personalTrainingId: number;
  planName: string;
  planData: WorkoutPlanData;
  isActive?: boolean;
}

export interface WorkoutPlanProgress {
  id: number;
  workoutPlanId: number;
  userId: number;
  dayNumber: number;
  exerciseId: string;
  completedAt: string;
  notes?: string;
}

export interface MarkExerciseCompleteRequest {
  workoutPlanId: number;
  dayNumber: number;
  exerciseId: string;
  notes?: string;
}
```

### 4.2 API Layer

**File**: `frontend/src/api/personalTraining.ts`

```typescript
import axiosInstance from './axiosInstance';
import { PersonalTraining, EnrollPersonalTrainingRequest } from '../types/personalTraining';

export const personalTrainingAPI = {
  enrollUser: (data: EnrollPersonalTrainingRequest) =>
    axiosInstance.post<PersonalTraining>('/api/personal-training/enroll', data),

  removeUser: (userId: number) =>
    axiosInstance.delete(`/api/personal-training/users/${userId}`),

  getAllActiveUsers: () =>
    axiosInstance.get<PersonalTraining[]>('/api/personal-training/users'),

  getByUserId: (userId: number) =>
    axiosInstance.get<PersonalTraining>(`/api/personal-training/users/${userId}`),

  updatePayment: (ptId: number, amount?: number, frequency?: string, customDays?: number) =>
    axiosInstance.patch<PersonalTraining>(`/api/personal-training/${ptId}/payment`, null, {
      params: { amount, frequency, customDays },
    }),
};
```

**File**: `frontend/src/api/workoutPlans.ts`

```typescript
import axiosInstance from './axiosInstance';
import {
  WorkoutPlan,
  CreateWorkoutPlanRequest,
  WorkoutPlanProgress,
  MarkExerciseCompleteRequest,
} from '../types/personalTraining';

export const workoutPlansAPI = {
  createPlan: (data: CreateWorkoutPlanRequest) =>
    axiosInstance.post<WorkoutPlan>('/api/workout-plans', data),

  updatePlan: (planId: number, data: CreateWorkoutPlanRequest) =>
    axiosInstance.put<WorkoutPlan>(`/api/workout-plans/${planId}`, data),

  duplicatePlan: (planId: number, targetPtId: number) =>
    axiosInstance.post<WorkoutPlan>(`/api/workout-plans/${planId}/duplicate`, null, {
      params: { targetPtId },
    }),

  activatePlan: (planId: number) =>
    axiosInstance.patch(`/api/workout-plans/${planId}/activate`),

  deactivatePlan: (planId: number) =>
    axiosInstance.patch(`/api/workout-plans/${planId}/deactivate`),

  deletePlan: (planId: number) =>
    axiosInstance.delete(`/api/workout-plans/${planId}`),

  getPlansByPersonalTrainingId: (ptId: number) =>
    axiosInstance.get<WorkoutPlan[]>(`/api/workout-plans/personal-training/${ptId}`),

  getActivePlanByUserId: (userId: number) =>
    axiosInstance.get<WorkoutPlan>(`/api/workout-plans/users/${userId}/active`),

  markExerciseComplete: (data: MarkExerciseCompleteRequest) =>
    axiosInstance.post<WorkoutPlanProgress>('/api/workout-plans/progress', data),

  getProgress: (workoutPlanId: number) =>
    axiosInstance.get<WorkoutPlanProgress[]>(`/api/workout-plans/${workoutPlanId}/progress`),
};
```

### 4.3 State Management (Zustand)

**File**: `frontend/src/stores/personalTrainingStore.ts`

```typescript
import { create } from 'zustand';
import { PersonalTraining, EnrollPersonalTrainingRequest } from '../types/personalTraining';
import { personalTrainingAPI } from '../api/personalTraining';
import { message } from 'antd';

interface PersonalTrainingState {
  ptUsers: PersonalTraining[];
  selectedPT: PersonalTraining | null;
  loading: boolean;
  error: string | null;

  fetchAllActiveUsers: () => Promise<void>;
  enrollUser: (data: EnrollPersonalTrainingRequest) => Promise<void>;
  removeUser: (userId: number) => Promise<void>;
  selectPT: (pt: PersonalTraining | null) => void;
  updatePayment: (ptId: number, amount?: number, frequency?: string, customDays?: number) => Promise<void>;
}

export const usePersonalTrainingStore = create<PersonalTrainingState>((set, get) => ({
  ptUsers: [],
  selectedPT: null,
  loading: false,
  error: null,

  fetchAllActiveUsers: async () => {
    set({ loading: true, error: null });
    try {
      const response = await personalTrainingAPI.getAllActiveUsers();
      set({ ptUsers: response.data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      message.error('Failed to fetch personal training users');
    }
  },

  enrollUser: async (data) => {
    set({ loading: true, error: null });
    try {
      await personalTrainingAPI.enrollUser(data);
      message.success('User enrolled in personal training successfully');
      await get().fetchAllActiveUsers();
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      message.error('Failed to enroll user in personal training');
      throw error;
    }
  },

  removeUser: async (userId) => {
    set({ loading: true, error: null });
    try {
      await personalTrainingAPI.removeUser(userId);
      message.success('User removed from personal training');
      await get().fetchAllActiveUsers();
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      message.error('Failed to remove user from personal training');
    }
  },

  selectPT: (pt) => {
    set({ selectedPT: pt });
  },

  updatePayment: async (ptId, amount, frequency, customDays) => {
    set({ loading: true, error: null });
    try {
      await personalTrainingAPI.updatePayment(ptId, amount, frequency, customDays);
      message.success('Payment details updated');
      await get().fetchAllActiveUsers();
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      message.error('Failed to update payment details');
    }
  },
}));
```

**File**: `frontend/src/stores/workoutPlanStore.ts`

```typescript
import { create } from 'zustand';
import {
  WorkoutPlan,
  CreateWorkoutPlanRequest,
  WorkoutPlanProgress,
  MarkExerciseCompleteRequest,
} from '../types/personalTraining';
import { workoutPlansAPI } from '../api/workoutPlans';
import { message } from 'antd';

interface WorkoutPlanState {
  workoutPlans: WorkoutPlan[];
  activeWorkoutPlan: WorkoutPlan | null;
  progress: WorkoutPlanProgress[];
  loading: boolean;
  error: string | null;

  fetchPlansByPTId: (ptId: number) => Promise<void>;
  fetchActivePlanByUserId: (userId: number) => Promise<void>;
  createPlan: (data: CreateWorkoutPlanRequest) => Promise<void>;
  updatePlan: (planId: number, data: CreateWorkoutPlanRequest) => Promise<void>;
  duplicatePlan: (planId: number, targetPtId: number) => Promise<void>;
  activatePlan: (planId: number) => Promise<void>;
  deletePlan: (planId: number) => Promise<void>;
  markExerciseComplete: (data: MarkExerciseCompleteRequest) => Promise<void>;
  fetchProgress: (workoutPlanId: number) => Promise<void>;
}

export const useWorkoutPlanStore = create<WorkoutPlanState>((set, get) => ({
  workoutPlans: [],
  activeWorkoutPlan: null,
  progress: [],
  loading: false,
  error: null,

  fetchPlansByPTId: async (ptId) => {
    set({ loading: true, error: null });
    try {
      const response = await workoutPlansAPI.getPlansByPersonalTrainingId(ptId);
      set({ workoutPlans: response.data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      message.error('Failed to fetch workout plans');
    }
  },

  fetchActivePlanByUserId: async (userId) => {
    set({ loading: true, error: null });
    try {
      const response = await workoutPlansAPI.getActivePlanByUserId(userId);
      set({ activeWorkoutPlan: response.data, loading: false });
    } catch (error: any) {
      set({ activeWorkoutPlan: null, loading: false });
      if (!error.response || error.response.status !== 404) {
        message.error('Failed to fetch active workout plan');
      }
    }
  },

  createPlan: async (data) => {
    set({ loading: true, error: null });
    try {
      await workoutPlansAPI.createPlan(data);
      message.success('Workout plan created successfully');
      await get().fetchPlansByPTId(data.personalTrainingId);
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      message.error('Failed to create workout plan');
      throw error;
    }
  },

  updatePlan: async (planId, data) => {
    set({ loading: true, error: null });
    try {
      await workoutPlansAPI.updatePlan(planId, data);
      message.success('Workout plan updated successfully');
      await get().fetchPlansByPTId(data.personalTrainingId);
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      message.error('Failed to update workout plan');
      throw error;
    }
  },

  duplicatePlan: async (planId, targetPtId) => {
    set({ loading: true, error: null });
    try {
      await workoutPlansAPI.duplicatePlan(planId, targetPtId);
      message.success('Workout plan duplicated successfully');
      await get().fetchPlansByPTId(targetPtId);
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      message.error('Failed to duplicate workout plan');
    }
  },

  activatePlan: async (planId) => {
    set({ loading: true, error: null });
    try {
      await workoutPlansAPI.activatePlan(planId);
      message.success('Workout plan activated');
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      message.error('Failed to activate workout plan');
    }
  },

  deletePlan: async (planId) => {
    set({ loading: true, error: null });
    try {
      await workoutPlansAPI.deletePlan(planId);
      message.success('Workout plan deleted');
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      message.error('Failed to delete workout plan');
    }
  },

  markExerciseComplete: async (data) => {
    try {
      await workoutPlansAPI.markExerciseComplete(data);
      message.success('Exercise marked as complete');
      await get().fetchProgress(data.workoutPlanId);
    } catch (error: any) {
      message.error('Failed to mark exercise as complete');
    }
  },

  fetchProgress: async (workoutPlanId) => {
    try {
      const response = await workoutPlansAPI.getProgress(workoutPlanId);
      set({ progress: response.data });
    } catch (error: any) {
      console.error('Failed to fetch progress:', error);
    }
  },
}));
```

---

## Component Structure Overview

### Owner Components
1. **PersonalTrainingTab** - Main tab showing list of PT users
2. **EnrollPTModal** - Modal to enroll/promote users to PT
3. **PTUserCard** - Card displaying PT user info with actions
4. **WorkoutPlansList** - List all plans for a PT user
5. **WorkoutPlanModal** - Complex builder for creating/editing plans
6. **DietPlanModal** - Placeholder with "Coming Soon"

### User Components
1. **MyWorkoutPlan** - View active workout plan
2. **WorkoutDayCard** - Display exercises for a specific day
3. **ExerciseItem** - Individual exercise with complete button

---

## Implementation Timeline

### **Phase 1** (Days 1-2): Database & Backend Entities
- Create migration scripts
- Create entity classes
- Create repositories
- Test database schema

### **Phase 2** (Days 3-4): Backend Services & APIs
- Implement PersonalTrainingService
- Implement WorkoutPlanService
- Create controllers
- Test endpoints with Postman

### **Phase 3** (Days 5-6): Frontend State & API
- Create TypeScript types
- Implement API functions
- Create Zustand stores
- Test API integration

### **Phase 4** (Days 7-9): Owner UI - PT Management
- PersonalTrainingTab component
- EnrollPTModal component
- PT user list and cards
- Integration with user detail page

### **Phase 5** (Days 10-13): Owner UI - Workout Plan Builder
- WorkoutPlanModal with form builder
- Dynamic day/exercise management
- Duplicate and activation features
- DietPlanModal placeholder

### **Phase 6** (Days 14-15): User UI - View Plans
- MyWorkoutPlan component
- WorkoutDayCard component
- Exercise completion functionality
- Progress tracking

### **Phase 7** (Days 16-17): Polish & Testing
- Add notifications
- Fix bugs
- UI/UX improvements
- End-to-end testing

---

## Testing Checklist

### Backend Tests
- [ ] Enroll user in PT
- [ ] Remove user from PT
- [ ] Create workout plan
- [ ] Update workout plan
- [ ] Activate/deactivate plans
- [ ] Duplicate plan
- [ ] Mark exercise complete
- [ ] Fetch progress

### Frontend Tests
- [ ] Display PT users list
- [ ] Enroll user modal
- [ ] Create workout plan
- [ ] Edit workout plan
- [ ] View active plan as user
- [ ] Mark exercise complete
- [ ] Duplicate plan between users

### Integration Tests
- [ ] Full flow: Enroll → Create Plan → Activate → User Views → Mark Complete
- [ ] Authorization checks
- [ ] Error handling

---

## Notes & Considerations

1. **JSON Flexibility**: Workout plan stored as JSON allows easy modification without schema changes
2. **Single Active Plan**: Only one plan can be active per user at a time
3. **Progress Tracking**: Users can mark exercises complete but cannot edit plan structure
4. **Diet Plan**: Phase 2 feature, currently showing placeholder
5. **Notifications**: Users notified on enrollment and plan assignment
6. **Payment Tracking**: PT has separate payment tracking from regular subscriptions
7. **Duplication**: Enables owners to reuse successful plans across users
8. **Scalability**: Structure supports future features like workout templates, exercise library, video links

---

## Success Criteria

✅ Owner can promote any user to Personal Training
✅ Owner can manage PT payment details separately
✅ Owner can create detailed workout plans with multiple days and exercises
✅ Owner can duplicate plans between users
✅ Owner can activate/deactivate plans
✅ Users can view their active workout plan
✅ Users can mark exercises as complete
✅ Diet plan modal shows "Coming Soon" placeholder
✅ All existing features remain functional
✅ Proper authorization and data validation

---

**End of Phase 2 Implementation Plan**
