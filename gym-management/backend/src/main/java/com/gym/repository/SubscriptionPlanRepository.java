package com.gym.repository;

import com.gym.entity.SubscriptionPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SubscriptionPlanRepository extends JpaRepository<SubscriptionPlan, Long> {

    List<SubscriptionPlan> findByIsActiveTrue();

    Optional<SubscriptionPlan> findByNameIgnoreCase(String name);
}
