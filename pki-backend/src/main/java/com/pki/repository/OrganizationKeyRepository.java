package com.pki.repository;

import com.pki.entity.OrganizationKey;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface OrganizationKeyRepository extends JpaRepository<OrganizationKey, Long> {
    Optional<OrganizationKey> findByOrganization(String organization);
}
