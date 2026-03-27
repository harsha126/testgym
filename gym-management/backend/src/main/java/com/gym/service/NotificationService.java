package com.gym.service;

import com.gym.dto.NotificationDTO;
import com.gym.entity.Notification;
import com.gym.entity.User;
import com.gym.repository.NotificationRepository;
import com.gym.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final WebPushService webPushService;
    private final SMSService smsService;

    public Page<NotificationDTO> getNotifications(Long userId, Pageable pageable) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::toDTO);
    }

    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    public void markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        notification.setIsRead(true);
        notificationRepository.save(notification);
    }

    public void createAndSendNotification(User user, String type, String title, String message) {
        log.info("Sending notification to userId={}: type={}, title='{}'", user.getId(), type, title);
        Notification notification = Notification.builder()
                .user(user)
                .type(type)
                .title(title)
                .message(message)
                .isRead(false)
                .sentVia("BOTH")
                .build();
        notificationRepository.save(notification);

        // Send web push
        try {
            webPushService.sendPushNotification(user, title, message);
        } catch (Exception e) {
            log.warn("Web push failed for userId={}: {}", user.getId(), e.getMessage());
            notification.setSentVia("SMS");
            notificationRepository.save(notification);
        }

        // Send mock SMS
        smsService.sendSMS(user.getPhone(), message);
    }

    private NotificationDTO toDTO(Notification n) {
        return NotificationDTO.builder()
                .id(n.getId())
                .type(n.getType())
                .title(n.getTitle())
                .message(n.getMessage())
                .isRead(n.getIsRead())
                .sentVia(n.getSentVia())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
