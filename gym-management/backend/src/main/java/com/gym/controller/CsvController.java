package com.gym.controller;

import com.gym.service.CsvImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/csv")
@RequiredArgsConstructor
public class CsvController {

    private final CsvImportService csvImportService;

    @PostMapping("/import")
    public ResponseEntity<Map<String, Object>> importCsv() {
        if (csvImportService.isAlreadyImported()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "CSV import has already been run"));
        }
        try {
            Map<String, Object> result = csvImportService.importFromCsv();
            return ResponseEntity.ok(result);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
