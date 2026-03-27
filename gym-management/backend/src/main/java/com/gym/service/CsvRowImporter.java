package com.gym.service;

import com.gym.entity.*;
import com.gym.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Slf4j
public class CsvRowImporter {

        private final UserRepository userRepository;
        private final SubscriptionPlanRepository planRepository;
        private final UserSubscriptionRepository subscriptionRepository;
        private final PaymentRepository paymentRepository;
        private final PasswordEncoder passwordEncoder;

        /**
         * Imports a single CSV row in its own transaction.
         * If the user already exists (duplicate phone), still creates the subscription
         * + payment.
         * Throws on validation or DB error so the caller can record it.
         */
        @Transactional(propagation = Propagation.REQUIRES_NEW)
        public boolean importRow(String phone, String name, boolean isActive, String gender,
                        String planName, LocalDate startDate, LocalDate endDate,
                        BigDecimal amount) {

                User user = userRepository.findByPhone(phone).orElseGet(() -> {
                        String password = phone.substring(Math.max(0, phone.length() - 4)) + "gym";
                        return userRepository.save(User.builder()
                                        .name(name)
                                        .phone(phone)
                                        .password(passwordEncoder.encode(password))
                                        .role(User.Role.USER)
                                        .isActive(isActive)
                                        .gender(gender.isEmpty() ? null : gender)
                                        .build());
                });

                SubscriptionPlan plan = planRepository.findByNameIgnoreCase(planName)
                                .orElseGet(() -> planRepository.findByNameIgnoreCase("Custom").orElseThrow());

                LocalDate effectiveStart = startDate != null ? startDate : LocalDate.now();
                LocalDate effectiveEnd = endDate != null ? endDate : LocalDate.now().plusDays(30);
                UserSubscription.Status status = effectiveEnd.isBefore(LocalDate.now())
                                ? UserSubscription.Status.EXPIRED
                                : UserSubscription.Status.ACTIVE;

                UserSubscription sub = UserSubscription.builder()
                                .user(user)
                                .plan(plan)
                                .startDate(effectiveStart)
                                .endDate(effectiveEnd)
                                .status(status)
                                .build();
                sub = subscriptionRepository.save(sub);

                if (amount != null && amount.compareTo(BigDecimal.ZERO) > 0) {
                        Payment payment = Payment.builder()
                                        .user(user)
                                        .subscription(sub)
                                        .amount(amount)
                                        .paymentDate(effectiveStart)
                                        .paymentMethod("CASH")
                                        .build();
                        paymentRepository.save(payment);
                }

                return true;
        }
}
