package com.pki.service;

import com.pki.entity.OrganizationKey;
import com.pki.repository.OrganizationKeyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.security.spec.KeySpec;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;

@Service
public class KeyManagementService {

    @Autowired
    private OrganizationKeyRepository organizationKeyRepository;

    @Autowired
    private EncryptionService encryptionService;

    @Value("${PKI_MASTER_KEY:${pki.master-key:}}")
    private String masterKey;

    @Value("${pki.master-salt:default_salt_value}")
    private String masterSalt;

    private static final int PBKDF2_ITERATIONS = 100_000;
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 128;

    private SecretKey deriveKek() throws Exception {
        if (masterKey == null || masterKey.isEmpty()) {
            throw new IllegalStateException("Master key is not configured. Set PKI_MASTER_KEY env var.");
        }
        byte[] saltBytes = masterSalt.getBytes(StandardCharsets.UTF_8);
        SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
        KeySpec spec = new PBEKeySpec(masterKey.toCharArray(), saltBytes, PBKDF2_ITERATIONS, 256);
        byte[] keyBytes = factory.generateSecret(spec).getEncoded();
        return new SecretKeySpec(keyBytes, "AES");
    }

    public synchronized byte[] getDekForOrganization(String organization) {
        try {
            Optional<OrganizationKey> existing = organizationKeyRepository.findByOrganization(organization);
            if (existing.isPresent()) {
                OrganizationKey ok = existing.get();
                SecretKey kek = deriveKek();
                String wrapped = ok.getWrappedDek();
                byte[] combined = Base64.getDecoder().decode(wrapped);
                if (combined.length < GCM_IV_LENGTH) throw new RuntimeException("Wrapped DEK invalid");
                byte[] iv = new byte[GCM_IV_LENGTH];
                System.arraycopy(combined, 0, iv, 0, iv.length);
                byte[] cipherText = new byte[combined.length - iv.length];
                System.arraycopy(combined, iv.length, cipherText, 0, cipherText.length);

                Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
                GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
                cipher.init(Cipher.DECRYPT_MODE, kek, spec);
                byte[] dek = cipher.doFinal(cipherText);
                return dek;
            }

            SecureRandom random = new SecureRandom();
            byte[] dek = new byte[32];
            random.nextBytes(dek);

            SecretKey kek = deriveKek();
            byte[] iv = new byte[GCM_IV_LENGTH];
            random.nextBytes(iv);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            SecretKeySpec kekSpec = new SecretKeySpec(kek.getEncoded(), "AES");
            cipher.init(Cipher.ENCRYPT_MODE, kekSpec, spec);
            byte[] wrapped = cipher.doFinal(dek);

            byte[] combined = new byte[iv.length + wrapped.length];
            System.arraycopy(iv, 0, combined, 0, iv.length);
            System.arraycopy(wrapped, 0, combined, iv.length, wrapped.length);

            String wrappedB64 = Base64.getEncoder().encodeToString(combined);
            String dekKeyId = UUID.randomUUID().toString();

            OrganizationKey ok = new OrganizationKey(organization, wrappedB64, dekKeyId, Instant.now(), "AES-GCM");
            organizationKeyRepository.save(ok);

            return dek;
        } catch (RuntimeException re) {
            throw re;
        } catch (Exception e) {
            throw new RuntimeException("Error getting DEK for org", e);
        }
    }
}
