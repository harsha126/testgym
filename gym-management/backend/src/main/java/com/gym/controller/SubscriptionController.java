package com.gym.controller;

import com.gym.dto.CreateSubscriptionRequest;
import com.gym.dto.SubscriptionDTO;
import com.gym.service.SubscriptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import org.springframework.http.HttpStatus;
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

    @DeleteMapping("/users/{userId}/subscriptions/{subscriptionId}")
    @PreAuthorize("hasRole('OWNER')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteSubscription(
            @PathVariable Long userId,
            @PathVariable Long subscriptionId) {
        subscriptionService.deleteSubscription(userId, subscriptionId);
    }

    @PostMapping("/users/{userId}/subscriptions")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<SubscriptionDTO> createSubscription(
            @PathVariable Long userId,
            @Valid @RequestBody CreateSubscriptionRequest request) {
        return ResponseEntity.ok(subscriptionService.createSubscription(userId, request));
    }
}
