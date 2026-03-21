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

    /**
     * Find all workout plans for a specific personal training enrollment
     */
    List<WorkoutPlan> findByPersonalTrainingId(Long personalTrainingId);

    /**
     * Find all workout plans for a personal training enrollment, ordered by creation date
     */
    List<WorkoutPlan> findByPersonalTrainingIdOrderByCreatedAtDesc(Long personalTrainingId);

    /**
     * Find the active workout plan for a personal training enrollment
     */
    @Query("SELECT wp FROM WorkoutPlan wp WHERE wp.personalTraining.id = :ptId AND wp.isActive = true")
    Optional<WorkoutPlan> findActiveByPersonalTrainingId(@Param("ptId") Long personalTrainingId);

    /**
     * Find the active workout plan for a user by their user ID
     */
    @Query("SELECT wp FROM WorkoutPlan wp " +
           "JOIN wp.personalTraining pt " +
           "WHERE pt.user.id = :userId AND wp.isActive = true")
    Optional<WorkoutPlan> findActiveByUserId(@Param("userId") Long userId);

    /**
     * Deactivate all workout plans for a specific personal training enrollment
     * Used when activating a new plan to ensure only one is active at a time
     */
    @Modifying
    @Query("UPDATE WorkoutPlan wp SET wp.isActive = false WHERE wp.personalTraining.id = :ptId")
    void deactivateAllPlansForPersonalTraining(@Param("ptId") Long personalTrainingId);

    /**
     * Count active workout plans for a personal training enrollment
     */
    @Query("SELECT COUNT(wp) FROM WorkoutPlan wp WHERE wp.personalTraining.id = :ptId AND wp.isActive = true")
    Long countActiveByPersonalTrainingId(@Param("ptId") Long personalTrainingId);

    /**
     * Find all workout plans created by a specific owner
     */
    List<WorkoutPlan> findByCreatedById(Long createdById);
}
