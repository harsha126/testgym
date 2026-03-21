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
