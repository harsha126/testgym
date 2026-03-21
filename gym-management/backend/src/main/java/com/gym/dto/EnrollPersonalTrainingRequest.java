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
             message = "Invalid payment frequency. Must be one of: MONTHLY, QUARTERLY, HALF_YEARLY, YEARLY, CUSTOM")
    private String paymentFrequency;

    private Integer customFrequencyDays;

    private String notes;
}
