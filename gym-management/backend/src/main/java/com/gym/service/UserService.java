package com.gym.service;

import com.gym.dto.UpdateUserRequest;
import com.gym.dto.UserDTO;
import com.gym.dto.UserStatsDTO;
import com.gym.entity.User;
import com.gym.entity.UserSubscription;
import com.gym.exception.ResourceNotFoundException;
import com.gym.repository.UserRepository;
import com.gym.repository.UserSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final UserSubscriptionRepository subscriptionRepository;
    private final PasswordEncoder passwordEncoder;

    public Page<UserDTO> getUsers(String search, Pageable pageable) {
        log.debug("Fetching users, search='{}', page={}", search, pageable.getPageNumber());
        Page<User> users;
        if (StringUtils.hasText(search)) {
            users = userRepository.searchUsers(search, pageable);
        } else {
            users = userRepository.findAllActiveUsers(pageable);
        }
        return users.map(this::toDTO);
    }

    public Page<UserDTO> getExpiringSoonUsers(Pageable pageable) {
        log.debug("Fetching expiring soon users, page={}", pageable.getPageNumber());
        LocalDate today = LocalDate.now();
        return userRepository.findUsersExpiringSoon(today, today.plusDays(3), pageable).map(this::toDTO);
    }

    public UserDTO getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return toDTO(user);
    }

    @Transactional
    public UserDTO updateUser(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        if (StringUtils.hasText(request.getName())) {
            user.setName(request.getName());
        }
        if (StringUtils.hasText(request.getPhone())) {
            if (!user.getPhone().equals(request.getPhone()) && userRepository.existsByPhone(request.getPhone())) {
                throw new RuntimeException("Phone number already in use");
            }
            user.setPhone(request.getPhone());
        }
        if (StringUtils.hasText(request.getPassword())) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        user = userRepository.save(user);
        log.info("User updated: userId={}", id);
        return toDTO(user);
    }

    @Transactional
    public void deactivateUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        user.setIsActive(false);
        userRepository.save(user);
        log.info("User deactivated: userId={}, name={}", id, user.getName());
    }

    public UserStatsDTO getStats() {
        long totalMembers = userRepository.countByRole(User.Role.USER);
        long activePlans = subscriptionRepository.countActive();
        LocalDate today = LocalDate.now();
        long expiringSoon = subscriptionRepository.countActiveExpiring(today, today.plusDays(3));
        return new UserStatsDTO(totalMembers, activePlans, expiringSoon);
    }

    private UserDTO toDTO(User user) {
        UserDTO dto = UserDTO.builder()
                .id(user.getId())
                .name(user.getName())
                .phone(user.getPhone())
                .role(user.getRole().name())
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .build();

        // Attach current subscription info
        subscriptionRepository.findCurrentActiveSubscription(user.getId())
                .ifPresent(sub -> {
                    dto.setCurrentPlan(sub.getPlan().getName());
                    dto.setEndDate(sub.getEndDate().toString());
                    long daysLeft = ChronoUnit.DAYS.between(LocalDate.now(), sub.getEndDate());
                    dto.setDaysLeft(Math.max(0, daysLeft));
                    dto.setSubscriptionStatus(sub.getStatus().name());
                });

        return dto;
    }
}
