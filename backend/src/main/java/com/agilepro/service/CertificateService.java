package com.agilepro.service;

import com.agilepro.dto.ApiResponse;
import com.agilepro.entity.Certificate;
import com.agilepro.entity.Registration;
import com.agilepro.enums.CertificateStatus;
import com.agilepro.enums.RegistrationStatus;
import com.agilepro.exception.ResourceNotFoundException;
import com.agilepro.repository.CertificateRepository;
import com.agilepro.repository.RegistrationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Random;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CertificateService {

    private final CertificateRepository certificateRepository;
    private final RegistrationRepository registrationRepository;
    private final EmailService emailService;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    public ApiResponse<?> issueCertificate(Long registrationId) {
        Registration reg = registrationRepository.findById(registrationId)
            .orElseThrow(() -> new ResourceNotFoundException("Registration", registrationId));

        if (reg.getStatus() != RegistrationStatus.CONFIRMED) {
            return ApiResponse.error("Registration must be CONFIRMED to issue a certificate", "NOT_CONFIRMED");
        }

        // Check for existing
        if (certificateRepository.findByRegistrationId(registrationId).isPresent()) {
            return ApiResponse.error("Certificate already issued for this registration", "ALREADY_ISSUED");
        }

        String certId = generateCertId(reg.getCourse().getCertificationType().name());
        String verifyUrl = frontendUrl + "/verify/" + certId;

        Certificate cert = Certificate.builder()
            .certificateId(certId)
            .registration(reg)
            .participantName(reg.getUser().getFullName())
            .certificationName(reg.getCourse().getTitle())
            .issueDate(LocalDate.now())
            .verificationUrl(verifyUrl)
            .status(CertificateStatus.ISSUED)
            // In production: generate PDF and store path here
            .pdfPath("/certificates/" + certId + ".pdf")
            .build();

        certificateRepository.save(cert);

        // Send email with download link
        emailService.sendCertificateEmail(
            reg.getUser().getEmail(),
            reg.getUser().getFullName(),
            certId,
            reg.getCourse().getTitle());

        log.info("Certificate {} issued for registration {}", certId, reg.getRegistrationRef());
        return ApiResponse.ok(cert, "Certificate issued successfully");
    }

    @Transactional(readOnly = true)
    public ApiResponse<Page<?>> listCertificates(Pageable pageable) {
        return ApiResponse.ok(certificateRepository.findAllByOrderByCreatedAtDesc(pageable));
    }

    private String generateCertId(String type) {
        String prefix = switch (type) {
            case "SAFE_AGILIST"          -> "SA";
            case "SAFE_SCRUM_MASTER"     -> "SSM";
            case "SAFE_POPM"             -> "POPM";
            case "SAFE_DEVOPS"           -> "SDP";
            case "SAFE_RTE"              -> "RTE";
            case "SAFE_SPC"              -> "SPC";
            default                      -> "APC";
        };
        return prefix + "-" + LocalDate.now().getYear()
            + "-" + String.format("%05d", new Random().nextInt(99999));
    }
}
