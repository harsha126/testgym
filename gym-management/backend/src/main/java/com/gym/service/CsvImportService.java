package com.gym.service;

import com.gym.entity.User;
import com.gym.repository.UserRepository;
import com.opencsv.CSVReader;
import com.opencsv.CSVReaderBuilder;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
@RequiredArgsConstructor
@Slf4j
public class CsvImportService {

    private final UserRepository userRepository;
    private final CsvRowImporter rowImporter;

    private final AtomicBoolean importDone = new AtomicBoolean(false);

    private static final String CSV_CLASSPATH = "data/cleaned.csv";

    // CSV columns (0-indexed): Add No., Active, Name, Sex, Address, Mobile No.,
    //                           Monthly Fees, Mode, Payment date, Next Payment
    private static final int COL_ACTIVE = 1;
    private static final int COL_NAME = 2;
    private static final int COL_SEX = 3;
    private static final int COL_PHONE = 5;
    private static final int COL_AMOUNT = 6;
    private static final int COL_MODE = 7;
    private static final int COL_PAYMENT_DATE = 8;
    private static final int COL_NEXT_PAYMENT = 9;

    @PostConstruct
    private void init() {
        // Mark as already done if non-owner users exist (import was run previously)
        // DataSeeder always creates exactly 1 USER ("user"). More than 1 means CSV was imported.
        if (userRepository.countByRole(com.gym.entity.User.Role.USER) > 1) {
            importDone.set(true);
            log.info("CSV import marked as already completed (users exist in DB)");
        }
    }

    public boolean isAlreadyImported() {
        return importDone.get();
    }

    public Map<String, Object> importFromCsv() throws Exception {
        if (importDone.get()) {
            throw new IllegalStateException("CSV import has already been run");
        }
        log.info("Starting CSV import from classpath:{}", CSV_CLASSPATH);

        int imported = 0;
        int skipped = 0;
        List<Map<String, String>> errors = new ArrayList<>();

        ClassPathResource resource = new ClassPathResource(CSV_CLASSPATH);
        try (CSVReader reader = new CSVReaderBuilder(
                new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))
                .withSkipLines(1)
                .build()) {

            String[] row;
            int lineNum = 2;

            while ((row = reader.readNext()) != null) {
                try {
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

                    String name = row[COL_NAME].trim();
                    if (name.isBlank()) name = "Unknown";

                    boolean isActive = "Active".equalsIgnoreCase(row[COL_ACTIVE].trim());
                    String gender = row[COL_SEX].trim();
                    String planName = row[COL_MODE].trim();

                    LocalDate startDate = parseDate(row[COL_PAYMENT_DATE].trim());
                    LocalDate endDate = parseDate(row[COL_NEXT_PAYMENT].trim());
                    BigDecimal amount = parseAmount(row[COL_AMOUNT].trim());

                    boolean wasImported = rowImporter.importRow(
                            phone, name, isActive, gender, planName, startDate, endDate, amount);

                    if (wasImported) imported++;
                    else skipped++;

                } catch (Exception e) {
                    log.warn("Failed to import row {}: {}", lineNum, e.getMessage());
                    errors.add(Map.of("row", String.valueOf(lineNum), "reason", e.getMessage()));
                }
                lineNum++;
            }
        }

        importDone.set(true);
        log.info("CSV import complete: imported={}, skipped={}, errors={}", imported, skipped, errors.size());

        Map<String, Object> result = new HashMap<>();
        result.put("imported", imported);
        result.put("skipped", skipped);
        result.put("errors", errors);
        return result;
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
