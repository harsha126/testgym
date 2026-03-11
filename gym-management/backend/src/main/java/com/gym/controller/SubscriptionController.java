package com.gym.controller;

import com.gym.dto.CreateSubscriptionRequest;
import com.gym.dto.SubscriptionDTO;
import com.gym.service.SubscriptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    @GetMapping("/subscription-plans")
    public ResponseEntity<List<SubscriptionDTO>> getPlans() {
        return ResponseEntity.ok(subscriptionService.getPlans());
    }

    @GetMapping("/users/{userId}/subscriptions")
    public ResponseEntity<List<SubscriptionDTO>> getSubscriptions(@PathVariable Long userId) {
        return ResponseEntity.ok(subscriptionService.getSubscriptionsByUserId(userId));
    }

    @GetMapping("/users/{userId}/subscriptions/current")
    public ResponseEntity<SubscriptionDTO> getCurrentSubscription(@PathVariable Long userId) {
        return ResponseEntity.ok(subscriptionService.getCurrentSubscription(userId));
    }

    @PostMapping("/users/{userId}/subscriptions")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<SubscriptionDTO> createSubscription(
            @PathVariable Long userId,
            @Valid @RequestBody CreateSubscriptionRequest request) {
        return ResponseEntity.ok(subscriptionService.createSubscription(userId, request));
    }
}
