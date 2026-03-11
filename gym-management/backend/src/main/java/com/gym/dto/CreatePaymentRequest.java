package com.gym.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CreatePaymentRequest {
    private Long subscriptionId;
    @NotNull
    private BigDecimal amount;
    @NotNull
    private LocalDate paymentDate;
    private String paymentMethod;
    private String notes;
}
