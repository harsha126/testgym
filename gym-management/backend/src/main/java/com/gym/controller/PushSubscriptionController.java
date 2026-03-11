package com.gym.controller;

import com.gym.dto.PushSubscriptionRequest;
import com.gym.entity.User;
import com.gym.service.WebPushService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/push")
@RequiredArgsConstructor
public class PushSubscriptionController {

    private final WebPushService webPushService;

    @PostMapping("/subscribe")
    public ResponseEntity<Void> subscribe(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody PushSubscriptionRequest request) {
        webPushService.registerSubscription(user, request.getEndpoint(), request.getP256dh(), request.getAuth());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/vapid-key")
    public ResponseEntity<Map<String, String>> getVapidKey() {
        return ResponseEntity.ok(Map.of("publicKey", webPushService.getVapidPublicKey()));
    }
}
