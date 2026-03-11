package com.gym.service;

import com.gym.entity.*;
import com.gym.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExcelService {

    private final UserRepository userRepository;
    private final SubscriptionPlanRepository planRepository;
    private final UserSubscriptionRepository subscriptionRepository;
    private final PaymentRepository paymentRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public Map<String, Object> importFromExcel(MultipartFile file) throws IOException {
        Workbook workbook = new XSSFWorkbook(file.getInputStream());
        Sheet sheet = workbook.getSheetAt(0);

        int imported = 0;
        int skipped = 0;
        List<Map<String, String>> errors = new ArrayList<>();

        for (int i = 1; i <= sheet.getLastRowNum(); i++) {
            Row row = sheet.getRow(i);
            if (row == null)
                continue;

            try {
                String name = getCellStringValue(row.getCell(0));
                String phone = getCellStringValue(row.getCell(1));
                String planName = getCellStringValue(row.getCell(2));
                LocalDate startDate = getCellDateValue(row.getCell(3));
                LocalDate endDate = getCellDateValue(row.getCell(4));
                BigDecimal amount = getCellNumericValue(row.getCell(5));

                if (phone == null || phone.isBlank()) {
                    errors.add(Map.of("row", String.valueOf(i + 1), "reason", "missing phone"));
                    continue;
                }

                if (userRepository.existsByPhone(phone)) {
                    skipped++;
                    continue;
                }

                // Create user
                String password = phone.substring(Math.max(0, phone.length() - 4)) + "gym";
                User user = User.builder()
                        .name(name != null ? name : "Unknown")
                        .phone(phone)
                        .password(passwordEncoder.encode(password))
                        .role(User.Role.USER)
                        .isActive(true)
                        .build();
                user = userRepository.save(user);

                // Find or create plan
                SubscriptionPlan plan = planRepository.findByNameIgnoreCase(planName != null ? planName : "")
                        .orElseGet(() -> {
                            SubscriptionPlan custom = planRepository.findByNameIgnoreCase("Custom")
                                    .orElseThrow();
                            return custom;
                        });

                // Create subscription
                UserSubscription.Status status = (endDate != null && !endDate.isBefore(LocalDate.now()))
                        ? UserSubscription.Status.ACTIVE
                        : UserSubscription.Status.EXPIRED;

                UserSubscription sub = UserSubscription.builder()
                        .user(user)
                        .plan(plan)
                        .startDate(startDate != null ? startDate : LocalDate.now())
                        .endDate(endDate != null ? endDate : LocalDate.now().plusDays(30))
                        .status(status)
                        .build();
                sub = subscriptionRepository.save(sub);

                // Create payment
                if (amount != null && amount.doubleValue() > 0) {
                    Payment payment = Payment.builder()
                            .user(user)
                            .subscription(sub)
                            .amount(amount)
                            .paymentDate(startDate != null ? startDate : LocalDate.now())
                            .paymentMethod("CASH")
                            .build();
                    paymentRepository.save(payment);
                }

                imported++;
            } catch (Exception e) {
                errors.add(Map.of("row", String.valueOf(i + 1), "reason", e.getMessage()));
            }
        }

        workbook.close();

        Map<String, Object> result = new HashMap<>();
        result.put("imported", imported);
        result.put("skipped", skipped);
        result.put("errors", errors);
        return result;
    }

    @Transactional
    public byte[] exportToExcel() throws IOException {
        // Get all data that hasn't been exported yet or has been updated
        List<User> users = userRepository.findAll().stream()
                .filter(u -> u.getRole() == User.Role.USER)
                .filter(u -> u.getLastExportedAt() == null || u.getUpdatedAt().isAfter(u.getLastExportedAt()))
                .toList();

        List<UserSubscription> subscriptions = subscriptionRepository.findAll().stream()
                .filter(s -> s.getLastExportedAt() == null || s.getCreatedAt().isAfter(s.getLastExportedAt()))
                .toList();

        if (users.isEmpty() && subscriptions.isEmpty()) {
            return null; // Indicates no data to export
        }

        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Gym Members");

        // Header
        Row header = sheet.createRow(0);
        String[] columns = { "Name", "Phone", "Plan Name", "Start Date", "End Date", "Status", "Amount Paid",
                "Payment Date", "Payment Method" };
        for (int i = 0; i < columns.length; i++) {
            Cell cell = header.createCell(i);
            cell.setCellValue(columns[i]);
            CellStyle style = workbook.createCellStyle();
            Font font = workbook.createFont();
            font.setBold(true);
            style.setFont(font);
            cell.setCellStyle(style);
        }

        // Data rows
        int rowNum = 1;
        Set<Long> exportedUserIds = new HashSet<>();
        Set<Long> exportedSubIds = new HashSet<>();

        for (UserSubscription sub : subscriptions) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(sub.getUser().getName());
            row.createCell(1).setCellValue(sub.getUser().getPhone());
            row.createCell(2).setCellValue(sub.getPlan().getName());
            row.createCell(3).setCellValue(sub.getStartDate().toString());
            row.createCell(4).setCellValue(sub.getEndDate().toString());
            row.createCell(5).setCellValue(sub.getStatus().name());

            // Find related payment
            List<Payment> payments = paymentRepository.findByUserIdOrderByPaymentDateDesc(sub.getUser().getId());
            Payment relatedPayment = payments.stream()
                    .filter(p -> p.getSubscription() != null && p.getSubscription().getId().equals(sub.getId()))
                    .findFirst().orElse(null);

            if (relatedPayment != null) {
                row.createCell(6).setCellValue(relatedPayment.getAmount().doubleValue());
                row.createCell(7).setCellValue(relatedPayment.getPaymentDate().toString());
                row.createCell(8).setCellValue(
                        relatedPayment.getPaymentMethod() != null ? relatedPayment.getPaymentMethod() : "");
            }

            exportedUserIds.add(sub.getUser().getId());
            exportedSubIds.add(sub.getId());
        }

        // Auto-size columns
        for (int i = 0; i < columns.length; i++) {
            sheet.autoSizeColumn(i);
        }

        // Update last_exported_at
        LocalDateTime now = LocalDateTime.now();
        for (Long userId : exportedUserIds) {
            userRepository.findById(userId).ifPresent(u -> {
                u.setLastExportedAt(now);
                userRepository.save(u);
            });
        }
        for (Long subId : exportedSubIds) {
            subscriptionRepository.findById(subId).ifPresent(s -> {
                s.setLastExportedAt(now);
                subscriptionRepository.save(s);
            });
        }

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        workbook.write(out);
        workbook.close();
        return out.toByteArray();
    }

    private String getCellStringValue(Cell cell) {
        if (cell == null)
            return null;
        if (cell.getCellType() == CellType.STRING)
            return cell.getStringCellValue().trim();
        if (cell.getCellType() == CellType.NUMERIC)
            return String.valueOf((long) cell.getNumericCellValue());
        return null;
    }

    private LocalDate getCellDateValue(Cell cell) {
        if (cell == null)
            return null;
        try {
            if (cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)) {
                return cell.getLocalDateTimeCellValue().toLocalDate();
            }
            if (cell.getCellType() == CellType.STRING) {
                return LocalDate.parse(cell.getStringCellValue().trim(), DateTimeFormatter.ofPattern("yyyy-MM-dd"));
            }
        } catch (Exception e) {
            log.warn("Failed to parse date from cell: {}", e.getMessage());
        }
        return null;
    }

    private BigDecimal getCellNumericValue(Cell cell) {
        if (cell == null)
            return null;
        if (cell.getCellType() == CellType.NUMERIC)
            return BigDecimal.valueOf(cell.getNumericCellValue());
        if (cell.getCellType() == CellType.STRING) {
            try {
                return new BigDecimal(cell.getStringCellValue().trim());
            } catch (Exception e) {
                return null;
            }
        }
        return null;
    }
}
