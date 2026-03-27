package com.gym.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserStatsDTO {
    private long totalMembers;
    private long activePlans;
    private long expiringSoon;
}
