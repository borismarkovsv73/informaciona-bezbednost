package com.pki.repository;

import com.pki.entity.Certificate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CertificateRepository extends JpaRepository<Certificate, Long> {
    Optional<Certificate> findBySerialNumber(String serialNumber);
    List<Certificate> findByType(Certificate.CertificateType type);
    List<Certificate> findByRevokedFalse();
    List<Certificate> findByIssuerSerialNumber(String issuerSerialNumber);
    boolean existsBySerialNumber(String serialNumber);
}