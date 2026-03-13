package com.gym.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentHistoryResponse {
    private BigDecimal monthlyTotal;
    private BigDecimal yearlyTotal;
    private List<PaymentDTO> payments;
    private long totalElements;
    private int totalPages;
    private int currentPage;
}
