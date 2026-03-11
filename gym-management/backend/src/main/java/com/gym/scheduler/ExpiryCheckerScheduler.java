package com.gym.scheduler;

import com.gym.entity.User;
import com.gym.entity.UserSubscription;
import com.gym.repository.UserRepository;
import com.gym.repository.UserSubscriptionRepository;
import com.gym.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class ExpiryCheckerScheduler {

    private final UserSubscriptionRepository subscriptionRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    @Scheduled(cron = "0 0 9 * * ?")
    @Transactional
    public void checkExpiringSubscriptions() {
        log.info("Running expiry checker...");

        LocalDate today = LocalDate.now();
        LocalDate threeDaysFromNow = today.plusDays(3);

        // Expiring in 3 days
        List<UserSubscription> expiringIn3Days = subscriptionRepository
                .findActiveSubscriptionsExpiringOn(threeDaysFromNow);
        for (UserSubscription sub : expiringIn3Days) {
            notificationService.createAndSendNotification(
                    sub.getUser(),
                    "EXPIRY_3DAY",
                    "Subscription Expiring Soon",
                    String.format("Your %s plan expires in 3 days (on %s). Please renew to continue.",
                            sub.getPlan().getName(), sub.getEndDate()));
        }

        // Expiring today
        List<UserSubscription> expiringToday = subscriptionRepository.findActiveSubscriptionsExpiringOn(today);
        for (UserSubscription sub : expiringToday) {
            sub.setStatus(UserSubscription.Status.EXPIRED);
            subscriptionRepository.save(sub);

            notificationService.createAndSendNotification(
                    sub.getUser(),
                    "EXPIRY_TODAY",
                    "Subscription Expired",
                    String.format("Your %s plan has expired today. Please renew to continue using the gym.",
                            sub.getPlan().getName()));
        }

        // Send summary to owner
        if (!expiringIn3Days.isEmpty() || !expiringToday.isEmpty()) {
            List<User> owners = userRepository.findAll().stream()
                    .filter(u -> u.getRole() == User.Role.OWNER && u.getIsActive())
                    .toList();

            for (User owner : owners) {
                notificationService.createAndSendNotification(
                        owner,
                        "OWNER_SUMMARY",
                        "Daily Expiry Summary",
                        String.format("%d users expiring in 3 days, %d users expired today.",
                                expiringIn3Days.size(), expiringToday.size()));
            }
        }

        log.info("Expiry checker completed. {} expiring in 3 days, {} expired today.",
                expiringIn3Days.size(), expiringToday.size());
    }
}
