package com.gym.repository;

import com.gym.entity.UserSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface UserSubscriptionRepository extends JpaRepository<UserSubscription, Long> {

    List<UserSubscription> findByUserIdOrderByCreatedAtDesc(Long userId);

    @Query("SELECT us FROM UserSubscription us WHERE us.user.id = :userId AND us.status = 'ACTIVE' ORDER BY us.endDate DESC")
    List<UserSubscription> findCurrentActiveSubscriptions(@Param("userId") Long userId);

    default Optional<UserSubscription> findCurrentActiveSubscription(Long userId) {
        return findCurrentActiveSubscriptions(userId).stream().findFirst();
    }

    @Query("SELECT us FROM UserSubscription us WHERE us.status = 'ACTIVE' AND us.endDate = :date")
    List<UserSubscription> findActiveSubscriptionsExpiringOn(@Param("date") LocalDate date);

    @Query("SELECT us FROM UserSubscription us JOIN FETCH us.user JOIN FETCH us.plan WHERE us.status = 'ACTIVE'")
    List<UserSubscription> findAllActiveWithUserAndPlan();

    @Query("SELECT us FROM UserSubscription us WHERE us.user.id = :userId AND us.status = 'ACTIVE'")
    List<UserSubscription> findActiveByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(us) FROM UserSubscription us WHERE us.status = 'ACTIVE'")
    long countActive();

    @Query("SELECT COUNT(us) FROM UserSubscription us WHERE us.status = 'ACTIVE' AND us.endDate BETWEEN :from AND :to")
    long countActiveExpiring(@Param("from") LocalDate from, @Param("to") LocalDate to);
}
