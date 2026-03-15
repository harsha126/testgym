package com.gym.service;

import com.gym.dto.CreatePaymentRequest;
import com.gym.dto.PaymentDTO;
import com.gym.dto.PaymentHistoryResponse;
import com.gym.entity.Payment;
import com.gym.entity.User;
import com.gym.entity.UserSubscription;
import com.gym.exception.ResourceNotFoundException;
import com.gym.repository.PaymentRepository;
import com.gym.repository.UserRepository;
import com.gym.repository.UserSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final UserSubscriptionRepository subscriptionRepository;

    public List<PaymentDTO> getPaymentsByUserId(Long userId) {
        return paymentRepository.findByUserIdOrderByPaymentDateDesc(userId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public PaymentDTO createPayment(Long userId, CreatePaymentRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Payment payment = Payment.builder()
                .user(user)
                .amount(request.getAmount())
                .paymentDate(request.getPaymentDate())
                .paymentMethod(request.getPaymentMethod())
                .notes(request.getNotes())
                .build();

        if (request.getSubscriptionId() != null) {
            UserSubscription sub = subscriptionRepository.findById(request.getSubscriptionId())
                    .orElseThrow(() -> new ResourceNotFoundException("Subscription not found"));
            payment.setSubscription(sub);
        }

        payment = paymentRepository.save(payment);
        return toDTO(payment);
    }

    public PaymentHistoryResponse getPaymentHistory(int year, int month, String search, int page, int size) {
        LocalDate monthStart = LocalDate.of(year, month, 1);
        LocalDate monthEnd = YearMonth.of(year, month).atEndOfMonth();
        LocalDate yearStart = LocalDate.of(year, 1, 1);
        LocalDate yearEnd = LocalDate.of(year, 12, 31);

        String searchParam = (search == null || search.isBlank()) ? null : search.trim();

        Page<Payment> paymentsPage = paymentRepository.findAllInDateRangeWithSearch(
                monthStart, monthEnd, searchParam, PageRequest.of(page, size));

        BigDecimal monthlyTotal = paymentRepository.sumAmountInDateRange(monthStart, monthEnd);
        BigDecimal yearlyTotal = paymentRepository.sumAmountInDateRange(yearStart, yearEnd);

        List<PaymentDTO> paymentDTOs = paymentsPage.getContent().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());

        return PaymentHistoryResponse.builder()
                .monthlyTotal(monthlyTotal)
                .yearlyTotal(yearlyTotal)
                .payments(paymentDTOs)
                .totalElements(paymentsPage.getTotalElements())
                .totalPages(paymentsPage.getTotalPages())
                .currentPage(paymentsPage.getNumber())
                .build();
    }

    private PaymentDTO toDTO(Payment payment) {
        return PaymentDTO.builder()
                .id(payment.getId())
                .userId(payment.getUser().getId())
                .userName(payment.getUser().getName())
                .userPhone(payment.getUser().getPhone())
                .subscriptionId(payment.getSubscription() != null ? payment.getSubscription().getId() : null)
                .planName(payment.getSubscription() != null ? payment.getSubscription().getPlan().getName() : null)
                .amount(payment.getAmount())
                .paymentDate(payment.getPaymentDate())
                .paymentMethod(payment.getPaymentMethod())
                .notes(payment.getNotes())
                .createdAt(payment.getCreatedAt())
                .build();
    }
}
