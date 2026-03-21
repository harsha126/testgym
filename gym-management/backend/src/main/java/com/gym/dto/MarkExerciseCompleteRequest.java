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
