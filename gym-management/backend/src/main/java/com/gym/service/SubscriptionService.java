package com.gym.service;

import com.gym.dto.CreateSubscriptionRequest;
import com.gym.dto.SubscriptionDTO;
import com.gym.entity.*;
import com.gym.exception.ResourceNotFoundException;
import com.gym.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SubscriptionService {

    private final UserSubscriptionRepository subscriptionRepository;
    private final SubscriptionPlanRepository planRepository;
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;

    public List<SubscriptionDTO> getSubscriptionsByUserId(Long userId) {
        return subscriptionRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public SubscriptionDTO getCurrentSubscription(Long userId) {
        UserSubscription sub = subscriptionRepository.findCurrentActiveSubscription(userId)
                .orElseThrow(() -> new ResourceNotFoundException("No active subscription found"));
        return toDTO(sub);
    }

    @Transactional
    public SubscriptionDTO createSubscription(Long userId, CreateSubscriptionRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        SubscriptionPlan plan = planRepository.findById(request.getPlanId())
                .orElseThrow(() -> new ResourceNotFoundException("Plan not found"));

        // Expire any currently active subscriptions
        List<UserSubscription> activeSubs = subscriptionRepository.findActiveByUserId(userId);
        for (UserSubscription activeSub : activeSubs) {
            activeSub.setStatus(UserSubscription.Status.EXPIRED);
            subscriptionRepository.save(activeSub);
        }

        // Calculate end date
        LocalDate endDate;
        if (plan.getIsCustom()) {
            if (request.getEndDate() != null) {
                endDate = request.getEndDate();
            } else if (request.getCustomDurationDays() != null) {
                endDate = request.getStartDate().plusDays(request.getCustomDurationDays());
            } else {
                throw new RuntimeException("Custom plan requires endDate or customDurationDays");
            }
        } else {
            endDate = request.getStartDate().plusDays(plan.getDurationDays());
        }

        UserSubscription subscription = UserSubscription.builder()
                .user(user)
                .plan(plan)
                .startDate(request.getStartDate())
                .endDate(endDate)
                .status(endDate.isBefore(LocalDate.now()) ? UserSubscription.Status.EXPIRED
                        : UserSubscription.Status.ACTIVE)
                .notes(request.getNotes())
                .build();

        subscription = subscriptionRepository.save(subscription);

        // Create payment if amount provided
        if (request.getAmount() != null && request.getAmount().doubleValue() > 0) {
            Payment payment = Payment.builder()
                    .user(user)
                    .subscription(subscription)
                    .amount(request.getAmount())
                    .paymentDate(request.getStartDate())
                    .paymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : "CASH")
                    .notes(request.getPaymentNotes())
                    .build();
            paymentRepository.save(payment);
        }

        return toDTO(subscription);
    }

    public List<SubscriptionDTO> getPlans() {
        return planRepository.findByIsActiveTrue().stream()
                .map(plan -> SubscriptionDTO.builder()
                        .planId(plan.getId())
                        .planName(plan.getName())
                        .planPrice(plan.getPrice())
                        .build())
                .collect(Collectors.toList());
    }

    private SubscriptionDTO toDTO(UserSubscription sub) {
        long daysRemaining = ChronoUnit.DAYS.between(LocalDate.now(), sub.getEndDate());
        return SubscriptionDTO.builder()
                .id(sub.getId())
                .userId(sub.getUser().getId())
                .userName(sub.getUser().getName())
                .planId(sub.getPlan().getId())
                .planName(sub.getPlan().getName())
                .startDate(sub.getStartDate())
                .endDate(sub.getEndDate())
                .status(sub.getStatus().name())
                .notes(sub.getNotes())
                .daysRemaining(Math.max(0, daysRemaining))
                .planPrice(sub.getPlan().getPrice())
                .createdAt(sub.getCreatedAt())
                .build();
    }
}
