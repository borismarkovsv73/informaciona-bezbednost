package com.pki.service;

import com.pki.entity.Certificate;
import com.pki.repository.CertificateRepository;
import org.bouncycastle.asn1.x500.X500Name;
import org.bouncycastle.asn1.x500.X500NameBuilder;
import org.bouncycastle.asn1.x500.style.BCStyle;
import org.bouncycastle.asn1.x509.BasicConstraints;
import org.bouncycastle.asn1.x509.Extension;
import org.bouncycastle.asn1.x509.KeyUsage;
import org.bouncycastle.cert.X509CertificateHolder;
import org.bouncycastle.cert.X509v3CertificateBuilder;
import org.bouncycastle.cert.jcajce.JcaX509CertificateConverter;
import org.bouncycastle.cert.jcajce.JcaX509v3CertificateBuilder;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.bouncycastle.openssl.jcajce.JcaPEMWriter;
import org.bouncycastle.operator.ContentSigner;
import org.bouncycastle.operator.jcajce.JcaContentSignerBuilder;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.StringWriter;
import java.math.BigInteger;
import java.security.*;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.security.spec.PKCS8EncodedKeySpec;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Base64;
import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
public class CertificateService {

    @Autowired
    private CertificateRepository certificateRepository;

    @Autowired
    private EncryptionService encryptionService;

        @Autowired
        private KeyManagementService keyManagementService;

    @Value("${pki.keystore-password}")
    private String keystorePassword;

    static {
        Security.addProvider(new BouncyCastleProvider());
    }

    public Certificate createSelfSignedCertificate(String commonName, String organization,
                                                  String organizationalUnit, String country,
                                                  String state, String locality, int validityYears) {
        try {
            // Generate key pair
            KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance("RSA");
            keyPairGenerator.initialize(2048);
            KeyPair keyPair = keyPairGenerator.generateKeyPair();

            // Build subject name
            X500Name subject = new X500NameBuilder()
                    .addRDN(BCStyle.CN, commonName)
                    .addRDN(BCStyle.O, organization)
                    .addRDN(BCStyle.OU, organizationalUnit)
                    .addRDN(BCStyle.C, country)
                    .addRDN(BCStyle.ST, state)
                    .addRDN(BCStyle.L, locality)
                    .build();

            // Generate serial number
            BigInteger serialNumber = new BigInteger(160, new SecureRandom());

            // Set validity period
            Date notBefore = new Date();
            Date notAfter = Date.from(LocalDateTime.now().plusYears(validityYears)
                    .atZone(ZoneId.systemDefault()).toInstant());

            // Create certificate builder
            X509v3CertificateBuilder certBuilder = new JcaX509v3CertificateBuilder(
                    subject, // issuer (self-signed)
                    serialNumber,
                    notBefore,
                    notAfter,
                    subject, // subject
                    keyPair.getPublic()
            );

            // Add extensions for root CA
            certBuilder.addExtension(Extension.basicConstraints, true, new BasicConstraints(true));
            certBuilder.addExtension(Extension.keyUsage, true, new KeyUsage(
                    KeyUsage.keyCertSign | KeyUsage.cRLSign | KeyUsage.digitalSignature));

            // Sign the certificate
            ContentSigner contentSigner = new JcaContentSignerBuilder("SHA256WithRSA")
                    .setProvider("BC").build(keyPair.getPrivate());

            X509CertificateHolder certHolder = certBuilder.build(contentSigner);
            X509Certificate cert = new JcaX509CertificateConverter()
                    .setProvider("BC").getCertificate(certHolder);

            // Convert to PEM format
            String certPem = convertToPem(cert);
            String privateKeyPem = convertPrivateKeyToPem(keyPair.getPrivate());

            // Create certificate entity
            Certificate certificate = new Certificate(commonName, organization, organizationalUnit,
                    country, state, locality, Certificate.CertificateType.SELF_SIGNED_ROOT);
            certificate.setSerialNumber(serialNumber.toString());
            certificate.setCertificateData(Base64.getEncoder().encodeToString(certPem.getBytes()));
            byte[] dek = keyManagementService.getDekForOrganization(organization);
            certificate.setEncryptedPrivateKey(encryptionService.encryptWithKey(dek, privateKeyPem));
            certificate.setExpiresAt(notAfter.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime());

            return certificateRepository.save(certificate);

        } catch (Exception e) {
            throw new RuntimeException("Error creating self-signed certificate", e);
        }
    }

    public Certificate createIntermediateCertificate(String commonName, String organization,
                                                   String organizationalUnit, String country,
                                                   String state, String locality, int validityYears,
                                                   String issuerSerialNumber) {
        try {
            // Find issuer certificate
            Certificate issuerCert = certificateRepository.findBySerialNumber(issuerSerialNumber)
                    .orElseThrow(() -> new RuntimeException("Issuer certificate not found"));

            // Generate key pair for intermediate certificate
            KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance("RSA");
            keyPairGenerator.initialize(2048);
            KeyPair keyPair = keyPairGenerator.generateKeyPair();

            // Get issuer private key (use issuer's organization DEK)
            byte[] issuerDek = keyManagementService.getDekForOrganization(issuerCert.getOrganization());
            String issuerPrivateKeyPem = encryptionService.decryptWithKey(issuerDek, issuerCert.getEncryptedPrivateKey());
            PrivateKey issuerPrivateKey = loadPrivateKeyFromPem(issuerPrivateKeyPem);

            // Get issuer certificate
            X509Certificate issuerX509Cert = loadCertificateFromPem(
                    new String(Base64.getDecoder().decode(issuerCert.getCertificateData())));

            // Build subject and issuer names
            X500Name issuerName = new X500Name(issuerX509Cert.getSubjectX500Principal().getName());
            X500Name subjectName = new X500NameBuilder()
                    .addRDN(BCStyle.CN, commonName)
                    .addRDN(BCStyle.O, organization)
                    .addRDN(BCStyle.OU, organizationalUnit)
                    .addRDN(BCStyle.C, country)
                    .addRDN(BCStyle.ST, state)
                    .addRDN(BCStyle.L, locality)
                    .build();

            // Generate serial number
            BigInteger serialNumber = new BigInteger(160, new SecureRandom());

            // Set validity period
            Date notBefore = new Date();
            Date notAfter = Date.from(LocalDateTime.now().plusYears(validityYears)
                    .atZone(ZoneId.systemDefault()).toInstant());

            // Create certificate builder
            X509v3CertificateBuilder certBuilder = new JcaX509v3CertificateBuilder(
                    issuerName,
                    serialNumber,
                    notBefore,
                    notAfter,
                    subjectName,
                    keyPair.getPublic()
            );

            // Add extensions for intermediate CA
            certBuilder.addExtension(Extension.basicConstraints, true, new BasicConstraints(0)); // pathLenConstraint = 0
            certBuilder.addExtension(Extension.keyUsage, true, new KeyUsage(
                    KeyUsage.keyCertSign | KeyUsage.cRLSign | KeyUsage.digitalSignature));

            // Sign the certificate with issuer's private key
            ContentSigner contentSigner = new JcaContentSignerBuilder("SHA256WithRSA")
                    .setProvider("BC").build(issuerPrivateKey);

            X509CertificateHolder certHolder = certBuilder.build(contentSigner);
            X509Certificate cert = new JcaX509CertificateConverter()
                    .setProvider("BC").getCertificate(certHolder);

            // Convert to PEM format
            String certPem = convertToPem(cert);
            String privateKeyPem = convertPrivateKeyToPem(keyPair.getPrivate());

            // Create certificate entity
            Certificate certificate = new Certificate(commonName, organization, organizationalUnit,
                    country, state, locality, Certificate.CertificateType.INTERMEDIATE);
            certificate.setSerialNumber(serialNumber.toString());
            certificate.setCertificateData(Base64.getEncoder().encodeToString(certPem.getBytes()));
            byte[] dek = keyManagementService.getDekForOrganization(organization);
            certificate.setEncryptedPrivateKey(encryptionService.encryptWithKey(dek, privateKeyPem));
            certificate.setExpiresAt(notAfter.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime());
            certificate.setIssuerSerialNumber(issuerSerialNumber);

            return certificateRepository.save(certificate);

        } catch (Exception e) {
            throw new RuntimeException("Error creating intermediate certificate", e);
        }
    }

    public Certificate createEndEntityCertificate(String commonName, String organization,
                                                String organizationalUnit, String country,
                                                String state, String locality, int validityYears,
                                                String issuerSerialNumber) {
        try {
            // Find issuer certificate
            Certificate issuerCert = certificateRepository.findBySerialNumber(issuerSerialNumber)
                    .orElseThrow(() -> new RuntimeException("Issuer certificate not found"));

            // Generate key pair for end entity certificate
            KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance("RSA");
            keyPairGenerator.initialize(2048);
            KeyPair keyPair = keyPairGenerator.generateKeyPair();

            // Get issuer private key (use issuer's organization DEK)
            byte[] issuerDek = keyManagementService.getDekForOrganization(issuerCert.getOrganization());
            String issuerPrivateKeyPem = encryptionService.decryptWithKey(issuerDek, issuerCert.getEncryptedPrivateKey());
            PrivateKey issuerPrivateKey = loadPrivateKeyFromPem(issuerPrivateKeyPem);

            // Get issuer certificate
            X509Certificate issuerX509Cert = loadCertificateFromPem(
                    new String(Base64.getDecoder().decode(issuerCert.getCertificateData())));

            // Build subject and issuer names
            X500Name issuerName = new X500Name(issuerX509Cert.getSubjectX500Principal().getName());
            X500Name subjectName = new X500NameBuilder()
                    .addRDN(BCStyle.CN, commonName)
                    .addRDN(BCStyle.O, organization)
                    .addRDN(BCStyle.OU, organizationalUnit)
                    .addRDN(BCStyle.C, country)
                    .addRDN(BCStyle.ST, state)
                    .addRDN(BCStyle.L, locality)
                    .build();

            // Generate serial number
            BigInteger serialNumber = new BigInteger(160, new SecureRandom());

            // Set validity period
            Date notBefore = new Date();
            Date notAfter = Date.from(LocalDateTime.now().plusYears(validityYears)
                    .atZone(ZoneId.systemDefault()).toInstant());

            // Create certificate builder
            X509v3CertificateBuilder certBuilder = new JcaX509v3CertificateBuilder(
                    issuerName,
                    serialNumber,
                    notBefore,
                    notAfter,
                    subjectName,
                    keyPair.getPublic()
            );

            // Add extensions for end entity
            certBuilder.addExtension(Extension.basicConstraints, false, new BasicConstraints(false));
            certBuilder.addExtension(Extension.keyUsage, true, new KeyUsage(
                    KeyUsage.digitalSignature | KeyUsage.keyEncipherment));

            // Sign the certificate with issuer's private key
            ContentSigner contentSigner = new JcaContentSignerBuilder("SHA256WithRSA")
                    .setProvider("BC").build(issuerPrivateKey);

            X509CertificateHolder certHolder = certBuilder.build(contentSigner);
            X509Certificate cert = new JcaX509CertificateConverter()
                    .setProvider("BC").getCertificate(certHolder);

            // Convert to PEM format
            String certPem = convertToPem(cert);
            String privateKeyPem = convertPrivateKeyToPem(keyPair.getPrivate());

            // Create certificate entity
            Certificate certificate = new Certificate(commonName, organization, organizationalUnit,
                    country, state, locality, Certificate.CertificateType.END_ENTITY);
            certificate.setSerialNumber(serialNumber.toString());
            certificate.setCertificateData(Base64.getEncoder().encodeToString(certPem.getBytes()));
            byte[] dek = keyManagementService.getDekForOrganization(organization);
            certificate.setEncryptedPrivateKey(encryptionService.encryptWithKey(dek, privateKeyPem));
            certificate.setExpiresAt(notAfter.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime());
            certificate.setIssuerSerialNumber(issuerSerialNumber);

            return certificateRepository.save(certificate);

        } catch (Exception e) {
            throw new RuntimeException("Error creating end entity certificate", e);
        }
    }

    public List<Certificate> getAllCertificates() {
        return certificateRepository.findAll();
    }

    public Optional<Certificate> getCertificateBySerialNumber(String serialNumber) {
        return certificateRepository.findBySerialNumber(serialNumber);
    }

    public List<Certificate> getCertificatesByType(Certificate.CertificateType type) {
        return certificateRepository.findByType(type);
    }

    public void revokeCertificate(String serialNumber) {
        Certificate cert = certificateRepository.findBySerialNumber(serialNumber)
                .orElseThrow(() -> new RuntimeException("Certificate not found"));
        cert.setRevoked(true);
        cert.setRevokedAt(LocalDateTime.now());
        certificateRepository.save(cert);
    }

    public byte[] createKeystore(String serialNumber, String keystoreType) {
        try {
            Certificate cert = certificateRepository.findBySerialNumber(serialNumber)
                    .orElseThrow(() -> new RuntimeException("Certificate not found"));

            // Decrypt private key using org-specific DEK
            byte[] dek = keyManagementService.getDekForOrganization(cert.getOrganization());
            String privateKeyPem = encryptionService.decryptWithKey(dek, cert.getEncryptedPrivateKey());
            PrivateKey privateKey = loadPrivateKeyFromPem(privateKeyPem);

            // Load certificate
            X509Certificate x509Cert = loadCertificateFromPem(
                    new String(Base64.getDecoder().decode(cert.getCertificateData())));

            // Create keystore
            KeyStore keystore = KeyStore.getInstance(keystoreType);
            keystore.load(null, null);

            // Add certificate and private key
            java.security.cert.Certificate[] certChain = {x509Cert};
            keystore.setKeyEntry(cert.getCommonName(), privateKey, keystorePassword.toCharArray(), certChain);

            // Convert to byte array
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            keystore.store(baos, keystorePassword.toCharArray());
            return baos.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Error creating keystore", e);
        }
    }

    private String convertToPem(X509Certificate cert) throws Exception {
        StringWriter writer = new StringWriter();
        JcaPEMWriter pemWriter = new JcaPEMWriter(writer);
        pemWriter.writeObject(cert);
        pemWriter.close();
        return writer.toString();
    }

    private String convertPrivateKeyToPem(PrivateKey privateKey) throws Exception {
        StringWriter writer = new StringWriter();
        JcaPEMWriter pemWriter = new JcaPEMWriter(writer);
        pemWriter.writeObject(privateKey);
        pemWriter.close();
        return writer.toString();
    }

    private PrivateKey loadPrivateKeyFromPem(String privateKeyPem) throws Exception {
        // Remove all PEM headers and whitespace
        String privateKeyPEM = privateKeyPem
                .replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replace("-----BEGIN RSA PRIVATE KEY-----", "")
                .replace("-----END RSA PRIVATE KEY-----", "")
                .replaceAll("\\s", "")
                .replaceAll("\\n", "")
                .replaceAll("\\r", "");

        // Debug print to see what we're trying to decode
        System.out.println("Cleaned private key PEM (first 50 chars): " + 
            (privateKeyPEM.length() > 50 ? privateKeyPEM.substring(0, 50) : privateKeyPEM));

        byte[] encoded = Base64.getDecoder().decode(privateKeyPEM);
        KeyFactory keyFactory = KeyFactory.getInstance("RSA");
        PKCS8EncodedKeySpec keySpec = new PKCS8EncodedKeySpec(encoded);
        return keyFactory.generatePrivate(keySpec);
    }

    private X509Certificate loadCertificateFromPem(String certPem) throws Exception {
        CertificateFactory certFactory = CertificateFactory.getInstance("X.509");
        ByteArrayInputStream inputStream = new ByteArrayInputStream(certPem.getBytes());
        return (X509Certificate) certFactory.generateCertificate(inputStream);
    }
}