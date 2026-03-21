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
