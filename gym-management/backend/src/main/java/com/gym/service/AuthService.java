package com.gym.service;

import com.gym.dto.LoginRequest;
import com.gym.dto.LoginResponse;
import com.gym.dto.RegisterRequest;
import com.gym.dto.UserDTO;
import com.gym.entity.User;
import com.gym.exception.UnauthorizedException;
import com.gym.repository.UserRepository;
import com.gym.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByPhone(request.getPhone())
                .orElseThrow(() -> new UnauthorizedException("Invalid phone or password"));

        if (!user.getIsActive()) {
            throw new UnauthorizedException("Account is deactivated");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new UnauthorizedException("Invalid phone or password");
        }

        String token = tokenProvider.generateToken(user.getId(), user.getPhone(), user.getRole().name());

        return new LoginResponse(token, user.getId(), user.getName(), user.getRole().name(), user.getPhone());
    }

    public UserDTO register(RegisterRequest request) {
        if (userRepository.existsByPhone(request.getPhone())) {
            throw new RuntimeException("Phone number already registered");
        }

        String password = request.getPassword();
        if (password == null || password.isBlank()) {
            // Default password: last 4 digits of phone + "gym"
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
