package com.gym.repository;

import com.gym.entity.Payment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByUserIdOrderByPaymentDateDesc(Long userId);

    @Query("""
            SELECT p FROM Payment p
            JOIN p.user u
            WHERE p.paymentDate >= :start AND p.paymentDate <= :end
            AND (:search IS NULL OR LOWER(u.name) LIKE LOWER(CONCAT('%', :search, '%'))
                 OR u.phone LIKE CONCAT('%', :search, '%'))
            ORDER BY p.paymentDate DESC
            """)
    Page<Payment> findAllInDateRangeWithSearch(
            @Param("start") LocalDate start,
            @Param("end") LocalDate end,
            @Param("search") String search,
            Pageable pageable);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.paymentDate >= :start AND p.paymentDate <= :end")
    BigDecimal sumAmountInDateRange(@Param("start") LocalDate start, @Param("end") LocalDate end);
}
