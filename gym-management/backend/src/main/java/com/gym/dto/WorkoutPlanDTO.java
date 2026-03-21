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
