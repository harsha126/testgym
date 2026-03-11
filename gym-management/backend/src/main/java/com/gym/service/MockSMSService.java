package com.gym.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

@Service
@Profile("default")
@Slf4j
public class MockSMSService implements SMSService {

    @Override
    public void sendSMS(String phoneNumber, String message) {
        log.info("[MOCK SMS] To: {}, Message: {}", phoneNumber, message);
    }
}
