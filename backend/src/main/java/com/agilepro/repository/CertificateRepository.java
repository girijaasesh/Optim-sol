package com.agilepro.repository;

import com.agilepro.entity.Certificate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CertificateRepository extends JpaRepository<Certificate, Long> {
    Optional<Certificate> findByCertificateId(String certId);
    Optional<Certificate> findByRegistrationId(Long registrationId);
    Page<Certificate> findAllByOrderByCreatedAtDesc(Pageable pageable);
    long countByStatus(com.agilepro.enums.CertificateStatus status);
}
