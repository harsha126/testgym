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
import java.time.LocalDateTime;

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
         * @param userCreatedAt earliest payment date across all rows for this phone —
         *                      used as User.createdAt on first insert
         * @param resolvedName  last name seen for this phone across the full CSV
         */
        @Transactional(propagation = Propagation.REQUIRES_NEW)
        public boolean importRow(String phone, String resolvedName, boolean isActive, String gender,
                        String planName, LocalDate startDate, LocalDate endDate,
                        BigDecimal amount, LocalDateTime userCreatedAt) {

                LocalDateTime rowTimestamp = startDate != null ? startDate.atStartOfDay() : userCreatedAt;

                User user = userRepository.findByPhone(phone).orElseGet(() -> {
                        String password = phone.substring(Math.max(0, phone.length() - 4)) + "gym";
                        return userRepository.save(User.builder()
                                        .name(resolvedName)
                                        .phone(phone)
                                        .password(passwordEncoder.encode(password))
                                        .role(User.Role.USER)
                                        .isActive(isActive)
                                        .gender(gender.isEmpty() ? null : gender)
                                        .createdAt(userCreatedAt)
                                        .build());
                });

                // Keep last name up to date for duplicate-phone rows
                if (!resolvedName.equals(user.getName())) {
                        user.setName(resolvedName);
                        userRepository.save(user);
                }

                SubscriptionPlan plan = planRepository.findByNameIgnoreCase(planName)
                                .orElseGet(() -> planRepository.findByNameIgnoreCase("Custom").orElseThrow());

                LocalDate effectiveStart = startDate != null ? startDate : LocalDate.now();
                LocalDate effectiveEnd = endDate != null ? endDate : LocalDate.now().plusDays(30);
                UserSubscription.Status status = effectiveEnd.isBefore(LocalDate.now())
                                ? UserSubscription.Status.EXPIRED
                                : UserSubscription.Status.ACTIVE;

                UserSubscription sub = subscriptionRepository.save(UserSubscription.builder()
                                .user(user)
                                .plan(plan)
                                .startDate(effectiveStart)
                                .endDate(effectiveEnd)
                                .status(status)
                                .createdAt(rowTimestamp)
                                .build());

                if (amount != null && amount.compareTo(BigDecimal.ZERO) > 0) {
                        paymentRepository.save(Payment.builder()
                                        .user(user)
                                        .subscription(sub)
                                        .amount(amount)
                                        .paymentDate(effectiveStart)
                                        .paymentMethod("CASH")
                                        .createdAt(rowTimestamp)
                                        .build());
                }

                return true;
        }
}
