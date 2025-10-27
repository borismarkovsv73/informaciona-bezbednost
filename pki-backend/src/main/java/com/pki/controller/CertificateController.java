package com.pki.controller;

import com.pki.dto.CertificateRequest;
import com.pki.dto.CertificateResponse;
import com.pki.entity.Certificate;
import com.pki.service.CertificateService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/certificates")
@PreAuthorize("hasRole('ADMIN')")
public class CertificateController {

    @Autowired
    private CertificateService certificateService;

    @PostMapping
    public ResponseEntity<?> createCertificate(@Valid @RequestBody CertificateRequest request) {
        Certificate certificate;

        try {
            System.out.println("Creating certificate with request: " + request.getType());
            Certificate.CertificateType type = Certificate.CertificateType.valueOf(request.getType());

            switch (type) {
                case SELF_SIGNED_ROOT:
                    certificate = certificateService.createSelfSignedCertificate(
                            request.getCommonName(),
                            request.getOrganization(),
                            request.getOrganizationalUnit(),
                            request.getCountry(),
                            request.getState(),
                            request.getLocality(),
                            request.getValidityYears()
                    );
                    break;
                case INTERMEDIATE:
                    if (request.getIssuerSerialNumber() == null) {
                        return ResponseEntity.badRequest().body("Issuer serial number is required for intermediate certificates");
                    }
                    certificate = certificateService.createIntermediateCertificate(
                            request.getCommonName(),
                            request.getOrganization(),
                            request.getOrganizationalUnit(),
                            request.getCountry(),
                            request.getState(),
                            request.getLocality(),
                            request.getValidityYears(),
                            request.getIssuerSerialNumber()
                    );
                    break;
                case END_ENTITY:
                    if (request.getIssuerSerialNumber() == null) {
                        return ResponseEntity.badRequest().body("Issuer serial number is required for end entity certificates");
                    }
                    certificate = certificateService.createEndEntityCertificate(
                            request.getCommonName(),
                            request.getOrganization(),
                            request.getOrganizationalUnit(),
                            request.getCountry(),
                            request.getState(),
                            request.getLocality(),
                            request.getValidityYears(),
                            request.getIssuerSerialNumber()
                    );
                    break;
                default:
                    return ResponseEntity.badRequest().body("Invalid certificate type");
            }

            return ResponseEntity.ok(convertToResponse(certificate));
        } catch (Exception e) {
            System.err.println("Error creating certificate: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error creating certificate: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<CertificateResponse>> getAllCertificates() {
        List<Certificate> certificates = certificateService.getAllCertificates();
        List<CertificateResponse> response = certificates.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{serialNumber}")
    public ResponseEntity<CertificateResponse> getCertificate(@PathVariable String serialNumber) {
        return certificateService.getCertificateBySerialNumber(serialNumber)
                .map(cert -> ResponseEntity.ok(convertToResponse(cert)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<List<CertificateResponse>> getCertificatesByType(@PathVariable String type) {
        try {
            Certificate.CertificateType certType = Certificate.CertificateType.valueOf(type);
            List<Certificate> certificates = certificateService.getCertificatesByType(certType);
            List<CertificateResponse> response = certificates.stream()
                    .map(this::convertToResponse)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{serialNumber}/revoke")
    public ResponseEntity<?> revokeCertificate(@PathVariable String serialNumber) {
        try {
            certificateService.revokeCertificate(serialNumber);
            return ResponseEntity.ok("Certificate revoked successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{serialNumber}/download/{format}")
    public ResponseEntity<byte[]> downloadCertificate(@PathVariable String serialNumber, 
                                                     @PathVariable String format) {
        try {
            String keystoreType = format.toUpperCase();
            if (!keystoreType.equals("PKCS12") && !keystoreType.equals("JKS")) {
                return ResponseEntity.badRequest().build();
            }

            byte[] keystore = certificateService.createKeystore(serialNumber, keystoreType);
            
            String filename = "certificate_" + serialNumber + "." + (keystoreType.equals("PKCS12") ? "p12" : "jks");
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", filename);
            headers.setContentLength(keystore.length);

            return new ResponseEntity<>(keystore, headers, HttpStatus.OK);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    private CertificateResponse convertToResponse(Certificate certificate) {
        CertificateResponse response = new CertificateResponse();
        response.setId(certificate.getId());
        response.setCommonName(certificate.getCommonName());
        response.setOrganization(certificate.getOrganization());
        response.setOrganizationalUnit(certificate.getOrganizationalUnit());
        response.setCountry(certificate.getCountry());
        response.setState(certificate.getState());
        response.setLocality(certificate.getLocality());
        response.setSerialNumber(certificate.getSerialNumber());
        response.setType(certificate.getType().name());
        response.setIssuedAt(certificate.getIssuedAt());
        response.setExpiresAt(certificate.getExpiresAt());
        response.setRevoked(certificate.isRevoked());
        response.setRevokedAt(certificate.getRevokedAt());
        response.setIssuerSerialNumber(certificate.getIssuerSerialNumber());
        response.setCertificateData(certificate.getCertificateData());
        return response;
    }
}