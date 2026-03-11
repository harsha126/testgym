package com.gym.config;

import com.gym.entity.User;
import com.gym.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class DataSeeder {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    public CommandLineRunner initData() {
        return args -> {
            log.info("Checking if test users exist...");

            if (!userRepository.existsByPhone("admin")) {
                User admin = User.builder()
                        .name("Test Admin")
                        .phone("admin")
                        .password(passwordEncoder.encode("admin"))
                        .role(User.Role.OWNER)
                        .isActive(true)
                        .build();
                userRepository.save(admin);
                log.info("Created test admin user (Phone: admin, Password: admin)");
            }

            if (!userRepository.existsByPhone("user")) {
                User user = User.builder()
                        .name("Test User")
                        .phone("user")
                        .password(passwordEncoder.encode("user"))
                        .role(User.Role.USER)
                        .isActive(true)
                        .build();
                userRepository.save(user);
                log.info("Created test regular user (Phone: user, Password: user)");
            }
        };
    }
}
