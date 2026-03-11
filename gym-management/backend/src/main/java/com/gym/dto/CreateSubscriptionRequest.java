package com.gym.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CreateSubscriptionRequest {
    @NotNull
    private Long planId;
    @NotNull
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer customDurationDays;
    private String notes;
    private BigDecimal amount;
    private String paymentMethod;
    private String paymentNotes;
}
