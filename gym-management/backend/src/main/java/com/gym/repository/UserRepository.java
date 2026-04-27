package com.gym.repository;

import com.gym.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

        Optional<User> findByPhone(String phone);

        boolean existsByPhone(String phone);

        long countByRole(User.Role role);

        @Modifying
        @Query("DELETE FROM User u WHERE u.role = :role")
        void deleteAllByRole(@Param("role") User.Role role);

        @Query(value = "SELECT u FROM User u WHERE u.isActive = true AND u.role = 'USER' AND " +
                        "(LOWER(u.name) LIKE LOWER(CONCAT('%', :search, '%')) OR u.phone LIKE CONCAT('%', :search, '%')) "
                        +
                        "ORDER BY u.updatedAt DESC, " +
                        "(SELECT MAX(p.paymentDate) FROM Payment p WHERE p.user = u) DESC NULLS LAST", countQuery = "SELECT COUNT(u) FROM User u WHERE u.isActive = true AND u.role = 'USER' AND "
                                        +
                                        "(LOWER(u.name) LIKE LOWER(CONCAT('%', :search, '%')) OR u.phone LIKE CONCAT('%', :search, '%'))")
        Page<User> searchUsers(@Param("search") String search, Pageable pageable);

        @Query(value = "SELECT u FROM User u WHERE u.isActive = true AND u.role = 'USER' " +
                        "ORDER BY u.updatedAt DESC, " +
                        "(SELECT MAX(p.paymentDate) FROM Payment p WHERE p.user = u) DESC NULLS LAST", countQuery = "SELECT COUNT(u) FROM User u WHERE u.isActive = true AND u.role = 'USER'")
        Page<User> findAllActiveUsers(Pageable pageable);

        @Query(value = "SELECT u FROM User u WHERE u.isActive = true AND u.role = 'USER' " +
                        "AND EXISTS (SELECT 1 FROM UserSubscription us WHERE us.user = u " +
                        "AND us.status = 'ACTIVE' AND us.endDate BETWEEN :from AND :to)", countQuery = "SELECT COUNT(u) FROM User u WHERE u.isActive = true AND u.role = 'USER' "
                                        +
                                        "AND EXISTS (SELECT 1 FROM UserSubscription us WHERE us.user = u " +
                                        "AND us.status = 'ACTIVE' AND us.endDate BETWEEN :from AND :to)")
        Page<User> findUsersExpiringSoon(@Param("from") LocalDate from, @Param("to") LocalDate to, Pageable pageable);
}
