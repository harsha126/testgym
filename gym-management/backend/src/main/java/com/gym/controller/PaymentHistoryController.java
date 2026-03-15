package com.gym.controller;

import com.gym.dto.PaymentHistoryResponse;
import com.gym.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentHistoryController {

    private final PaymentService paymentService;

    @GetMapping("/history")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<PaymentHistoryResponse> getPaymentHistory(
            @RequestParam int year,
            @RequestParam int month,
            @RequestParam(required = false, defaultValue = "") String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(paymentService.getPaymentHistory(year, month, search, page, size));
    }
}
