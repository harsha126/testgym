package com.gym.service;

import com.gym.entity.User;
import com.gym.repository.PaymentRepository;
import com.gym.repository.UserRepository;
import com.gym.repository.UserSubscriptionRepository;
import com.opencsv.CSVReader;
import com.opencsv.CSVReaderBuilder;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
@RequiredArgsConstructor
@Slf4j
public class CsvImportService {

    private final UserRepository userRepository;
    private final UserSubscriptionRepository subscriptionRepository;
    private final PaymentRepository paymentRepository;
    private final CsvRowImporter rowImporter;

    private final AtomicBoolean importDone = new AtomicBoolean(false);

    private static final String CSV_CLASSPATH = "data/cleaned.csv";

    private static final int COL_ACTIVE        = 1;
    private static final int COL_NAME          = 2;
    private static final int COL_SEX           = 3;
    private static final int COL_PHONE         = 5;
    private static final int COL_AMOUNT        = 6;
    private static final int COL_MODE          = 7;
    private static final int COL_PAYMENT_DATE  = 8;
    private static final int COL_NEXT_PAYMENT  = 9;

    private static class ParsedRow {
        final String phone;
        final String name;
        final boolean isActive;
        final String gender;
        final String planName;
        final LocalDate startDate;
        final LocalDate endDate;
        final BigDecimal amount;
        final int lineNum;

        ParsedRow(String phone, String name, boolean isActive, String gender,
                  String planName, LocalDate startDate, LocalDate endDate,
                  BigDecimal amount, int lineNum) {
            this.phone = phone; this.name = name; this.isActive = isActive;
            this.gender = gender; this.planName = planName;
            this.startDate = startDate; this.endDate = endDate;
            this.amount = amount; this.lineNum = lineNum;
        }
    }

    @PostConstruct
    private void init() {
        if (userRepository.countByRole(User.Role.USER) > 1) {
            importDone.set(true);
            log.info("CSV import marked as already completed (users exist in DB)");
        }
    }

    public boolean isAlreadyImported() {
        return importDone.get();
    }

    public Map<String, Object> importFromCsv() throws Exception {
        if (!importDone.compareAndSet(false, true)) {
            throw new IllegalStateException("CSV import has already been run");
        }
        log.info("Starting CSV import from classpath:{}", CSV_CLASSPATH);
        try {
            return runImport();
        } catch (Exception e) {
            importDone.set(false);
            throw e;
        }
    }

    private Map<String, Object> runImport() throws Exception {

        // --- First pass: collect all valid rows ---
        List<ParsedRow> validRows = new ArrayList<>();
        List<Map<String, String>> errors = new ArrayList<>();

        ClassPathResource resource = new ClassPathResource(CSV_CLASSPATH);
        try (CSVReader reader = new CSVReaderBuilder(
                new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))
                .withSkipLines(1).build()) {

            String[] row;
            int lineNum = 2;
            while ((row = reader.readNext()) != null) {
                if (row.length <= COL_NEXT_PAYMENT) {
                    errors.add(Map.of("row", String.valueOf(lineNum), "reason", "not enough columns"));
                    lineNum++;
                    continue;
                }

                String phone = row[COL_PHONE].trim();
                if (phone.isBlank() || phone.startsWith("PHONE_MISSING_")) {
                    errors.add(Map.of("row", String.valueOf(lineNum), "reason", "missing phone"));
                    lineNum++;
                    continue;
                }

                phone = phone.split(",")[0].trim();
                if (phone.length() > 20) phone = phone.substring(0, 20);

                String name = row[COL_NAME].trim();
                if (name.isBlank()) name = "Unknown";

                boolean isActive = "Active".equalsIgnoreCase(row[COL_ACTIVE].trim());
                String gender    = row[COL_SEX].trim();
                String planName  = row[COL_MODE].trim();

                LocalDate startDate = parseDate(row[COL_PAYMENT_DATE].trim());
                LocalDate endDate   = parseDate(row[COL_NEXT_PAYMENT].trim());
                BigDecimal amount   = parseAmount(row[COL_AMOUNT].trim());

                validRows.add(new ParsedRow(phone, name, isActive, gender, planName, startDate, endDate, amount, lineNum));
                lineNum++;
            }
        }

        // --- Build lookup maps from valid rows ---
        // phone -> earliest payment date (as LocalDateTime)
        Map<String, LocalDateTime> phoneEarliestDate = new HashMap<>();
        // phone -> last name seen
        Map<String, String> phoneLastName = new HashMap<>();
        // phone -> isActive (true if any row for this phone is Active)
        Map<String, Boolean> phoneAnyActive = new HashMap<>();

        for (ParsedRow r : validRows) {
            phoneLastName.put(r.phone, r.name);
            phoneAnyActive.merge(r.phone, r.isActive, (a, b) -> a || b);

            if (r.startDate != null) {
                LocalDateTime ts = r.startDate.atStartOfDay();
                phoneEarliestDate.merge(r.phone, ts, (a, b) -> a.isBefore(b) ? a : b);
            }
        }

        // --- Second pass: import each row ---
        int imported = 0;
        int skipped  = 0;

        for (ParsedRow r : validRows) {
            try {
                LocalDateTime userCreatedAt = phoneEarliestDate.getOrDefault(r.phone, LocalDateTime.now());
                String resolvedName = phoneLastName.getOrDefault(r.phone, r.name);
                boolean userActive = phoneAnyActive.getOrDefault(r.phone, r.isActive);

                boolean wasImported = rowImporter.importRow(
                        r.phone, resolvedName, userActive, r.gender,
                        r.planName, r.startDate, r.endDate, r.amount,
                        userCreatedAt);

                if (wasImported) imported++; else skipped++;
            } catch (Exception e) {
                log.warn("Failed to import row {}: {}", r.lineNum, e.getMessage());
                errors.add(Map.of("row", String.valueOf(r.lineNum), "reason", e.getMessage()));
            }
        }

        log.info("CSV import complete: imported={}, skipped={}, errors={}", imported, skipped, errors.size());

        Map<String, Object> result = new HashMap<>();
        result.put("imported", imported);
        result.put("skipped", skipped);
        result.put("errors", errors);
        return result;
    }

    @Transactional
    public Map<String, Object> resetImport() {
        log.info("Resetting CSV import: deleting all USER-role data");

        // FK order: payments -> subscriptions -> users
        paymentRepository.deleteAllByUserRole(User.Role.USER);
        subscriptionRepository.deleteAllByUserRole(User.Role.USER);
        userRepository.deleteAllByRole(User.Role.USER);

        importDone.set(false);
        log.info("CSV import reset complete");
        return Map.of("status", "reset complete");
    }

    private LocalDate parseDate(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return LocalDate.parse(value, DateTimeFormatter.ISO_LOCAL_DATE);
        } catch (Exception e) {
            log.warn("Failed to parse date '{}': {}", value, e.getMessage());
            return null;
        }
    }

    private BigDecimal parseAmount(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return new BigDecimal(value);
        } catch (Exception e) {
            return null;
        }
    }
}
