package com.gym.service;

import com.gym.entity.PushSubscription;
import com.gym.entity.User;
import com.gym.repository.PushSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebPushService {

    private final PushSubscriptionRepository pushSubscriptionRepository;

    @Value("${app.vapid.public-key}")
    private String vapidPublicKey;

    @Value("${app.vapid.private-key}")
    private String vapidPrivateKey;

    @Value("${app.vapid.subject}")
    private String vapidSubject;

    public void sendPushNotification(User user, String title, String message) {
        List<PushSubscription> subscriptions = pushSubscriptionRepository.findByUserId(user.getId());

        for (PushSubscription sub : subscriptions) {
            try {
                // Using web-push library
                nl.martijndwars.webpush.Notification notification = new nl.martijndwars.webpush.Notification(
                        sub.getEndpoint(),
                        sub.getP256dhKey(),
                        sub.getAuthKey(),
                        String.format("{\"title\":\"%s\",\"body\":\"%s\",\"icon\":\"/icon.png\"}", title, message));

                nl.martijndwars.webpush.PushService pushService = new nl.martijndwars.webpush.PushService();
                pushService.setPublicKey(vapidPublicKey);
                pushService.setPrivateKey(vapidPrivateKey);
                pushService.setSubject(vapidSubject);

                pushService.send(notification);
                log.info("Web push sent to user: {}", user.getName());
            } catch (Exception e) {
                log.error("Failed to send web push to user {}: {}", user.getName(), e.getMessage());
            }
        }
    }

    public void registerSubscription(User user, String endpoint, String p256dh, String auth) {
        // Remove old subscriptions for this user, then add new one
        pushSubscriptionRepository.deleteByUserId(user.getId());

        PushSubscription subscription = PushSubscription.builder()
                .user(user)
                .endpoint(endpoint)
                .p256dhKey(p256dh)
                .authKey(auth)
                .build();

        pushSubscriptionRepository.save(subscription);
    }

    public String getVapidPublicKey() {
        return vapidPublicKey;
    }
}
