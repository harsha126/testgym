package com.gym.service;

import com.gym.dto.LoginRequest;
import com.gym.dto.LoginResponse;
import com.gym.dto.RegisterRequest;
import com.gym.dto.UserDTO;
import com.gym.entity.RefreshToken;
import com.gym.entity.User;
import com.gym.exception.UnauthorizedException;
import com.gym.repository.UserRepository;
import com.gym.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final RefreshTokenService refreshTokenService;

    public record LoginResult(LoginResponse loginResponse, String rawRefreshToken) {}

    public LoginResult login(LoginRequest request) {
        log.info("Login attempt for phone={}", request.getPhone());
        User user = userRepository.findByPhone(request.getPhone())
                .orElseThrow(() -> {
                    log.warn("Login failed - phone not found: {}", request.getPhone());
                    return new UnauthorizedException("Invalid phone or password");
                });

        if (!user.getIsActive()) {
            log.warn("Login failed - account deactivated: userId={}", user.getId());
            throw new UnauthorizedException("Account is deactivated");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            log.warn("Login failed - wrong password for userId={}", user.getId());
            throw new UnauthorizedException("Invalid phone or password");
        }

        String accessToken = tokenProvider.generateToken(user.getId(), user.getPhone(), user.getRole().name());
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);
        log.info("Login successful: userId={}, role={}", user.getId(), user.getRole());

        LoginResponse response = new LoginResponse(accessToken, user.getId(), user.getName(), user.getRole().name(), user.getPhone());
        return new LoginResult(response, refreshToken.getToken());
    }

    public record RefreshResult(String accessToken, String rawRefreshToken) {}

    public RefreshResult refresh(String rawRefreshToken) {
        RefreshToken rotated = refreshTokenService.validateAndRotate(rawRefreshToken);
        User user = rotated.getUser();
        log.debug("Token refreshed for userId={}", user.getId());
        String newAccessToken = tokenProvider.generateToken(user.getId(), user.getPhone(), user.getRole().name());
        return new RefreshResult(newAccessToken, rotated.getToken());
    }

    public void logout(String rawRefreshToken) {
        if (rawRefreshToken != null) {
            refreshTokenService.deleteByToken(rawRefreshToken);
            log.debug("Refresh token revoked on logout");
        }
    }

    public UserDTO register(RegisterRequest request) {
        log.info("Registering new user: phone={}", request.getPhone());
        if (userRepository.existsByPhone(request.getPhone())) {
            log.warn("Registration failed - phone already exists: {}", request.getPhone());
            throw new RuntimeException("Phone number already registered");
        }

        String password = request.getPassword();
        if (password == null || password.isBlank()) {
            String phone = request.getPhone();
            password = phone.substring(Math.max(0, phone.length() - 4)) + "gym";
        }

        User user = User.builder()
                .name(request.getName())
                .phone(request.getPhone())
                .password(passwordEncoder.encode(password))
                .role(User.Role.USER)
                .isActive(true)
                .build();

        user = userRepository.save(user);
        log.info("User registered: userId={}, name={}", user.getId(), user.getName());

        return UserDTO.builder()
                .id(user.getId())
                .name(user.getName())
                .phone(user.getPhone())
                .role(user.getRole().name())
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
