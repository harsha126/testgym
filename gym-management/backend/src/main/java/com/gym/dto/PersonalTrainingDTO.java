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
