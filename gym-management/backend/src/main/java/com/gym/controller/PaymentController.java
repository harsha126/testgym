package com.gym.controller;

import com.gym.dto.CreatePaymentRequest;
import com.gym.dto.PaymentDTO;
import com.gym.dto.PaymentHistoryResponse;
import com.gym.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @GetMapping("/api/users/{userId}/payments")
    public ResponseEntity<List<PaymentDTO>> getPayments(@PathVariable Long userId) {
        return ResponseEntity.ok(paymentService.getPaymentsByUserId(userId));
    }

    @PostMapping("/api/users/{userId}/payments")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<PaymentDTO> createPayment(
            @PathVariable Long userId,
            @Valid @RequestBody CreatePaymentRequest request) {
        return ResponseEntity.ok(paymentService.createPayment(userId, request));
    }

    @GetMapping("/api/payments/history")
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
