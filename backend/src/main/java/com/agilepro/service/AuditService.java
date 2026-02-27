package com.agilepro.service;

import com.agilepro.entity.AuditLog;
import com.agilepro.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    @Async
    public void log(String action, String username, String ipAddress, String details) {
        auditLogRepository.save(AuditLog.builder()
            .action(action)
            .username(username)
            .ipAddress(ipAddress)
            .details(details)
            .build());
    }
}
