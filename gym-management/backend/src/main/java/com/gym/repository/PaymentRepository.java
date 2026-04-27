package com.gym.repository;

import com.gym.entity.Payment;
import com.gym.entity.User;
import com.gym.entity.UserSubscription;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

        List<Payment> findByUserIdOrderByPaymentDateDesc(Long userId);

        void deleteBySubscription(UserSubscription subscription);

        @Modifying
        @Query("DELETE FROM Payment p WHERE p.user.id IN (SELECT u.id FROM User u WHERE u.role = :role)")
        void deleteAllByUserRole(@Param("role") User.Role role);

        @Query(value = """
                        SELECT p FROM Payment p
                        JOIN p.user u
                        LEFT JOIN p.subscription s
                        WHERE p.paymentDate >= :start AND p.paymentDate <= :end
                        AND (:search = '' OR LOWER(u.name) LIKE LOWER(CONCAT('%', :search, '%'))
                             OR u.phone LIKE CONCAT('%', :search, '%'))
                        ORDER BY p.paymentDate DESC
                        """, countQuery = """
                        SELECT COUNT(p) FROM Payment p
                        JOIN p.user u
                        WHERE p.paymentDate >= :start AND p.paymentDate <= :end
                        AND (:search = '' OR LOWER(u.name) LIKE LOWER(CONCAT('%', :search, '%'))
                             OR u.phone LIKE CONCAT('%', :search, '%'))
                        """)
        Page<Payment> findAllInDateRangeWithSearch(
                        @Param("start") LocalDate start,
                        @Param("end") LocalDate end,
                        @Param("search") String search,
                        Pageable pageable);

        @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.paymentDate >= :start AND p.paymentDate <= :end")
        BigDecimal sumAmountInDateRange(@Param("start") LocalDate start, @Param("end") LocalDate end);
}
