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

    /**
     * Find all progress records for a specific workout plan and user
     */
    List<WorkoutPlanProgress> findByWorkoutPlanIdAndUserId(Long workoutPlanId, Long userId);

    /**
     * Find all progress records for a user, ordered by completion time
     */
    List<WorkoutPlanProgress> findByUserIdOrderByCompletedAtDesc(Long userId);

    /**
     * Find progress records for a specific exercise on a specific day
     */
    @Query("SELECT wpp FROM WorkoutPlanProgress wpp " +
           "WHERE wpp.workoutPlan.id = :workoutPlanId " +
           "AND wpp.user.id = :userId " +
           "AND wpp.dayNumber = :dayNumber " +
           "AND wpp.exerciseId = :exerciseId " +
           "ORDER BY wpp.completedAt DESC")
    List<WorkoutPlanProgress> findByWorkoutPlanAndUserAndDayAndExercise(
        @Param("workoutPlanId") Long workoutPlanId,
        @Param("userId") Long userId,
        @Param("dayNumber") Integer dayNumber,
        @Param("exerciseId") String exerciseId
    );

    /**
     * Count total completed exercises for a workout plan by a user
     */
    @Query("SELECT COUNT(wpp) FROM WorkoutPlanProgress wpp " +
           "WHERE wpp.workoutPlan.id = :workoutPlanId AND wpp.user.id = :userId")
    Long countCompletedExercises(
        @Param("workoutPlanId") Long workoutPlanId,
        @Param("userId") Long userId
    );

    /**
     * Find progress records within a date range
     */
    @Query("SELECT wpp FROM WorkoutPlanProgress wpp " +
           "WHERE wpp.user.id = :userId " +
           "AND wpp.completedAt BETWEEN :startDate AND :endDate " +
           "ORDER BY wpp.completedAt DESC")
    List<WorkoutPlanProgress> findByUserIdAndDateRange(
        @Param("userId") Long userId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );

    /**
     * Find all progress for a workout plan
     */
    List<WorkoutPlanProgress> findByWorkoutPlanIdOrderByCompletedAtDesc(Long workoutPlanId);

    /**
     * Delete all progress records for a workout plan
     */
    void deleteByWorkoutPlanId(Long workoutPlanId);
}
