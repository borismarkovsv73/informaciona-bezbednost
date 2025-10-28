package com.pki.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "organization_keys")
public class OrganizationKey {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String organization; // matches Certificate.organization

    @Lob
    @Column(nullable = false)
    private String wrappedDek; // Base64 of wrapped DEK 

    @Column(nullable = false, unique = true)
    private String dekKeyId; // UUID for the DEK

    @Column(nullable = false)
    private Instant createdAt;

    @Column
    private String algorithm;

    public OrganizationKey() {}

    public OrganizationKey(String organization, String wrappedDek, String dekKeyId, Instant createdAt, String algorithm) {
        this.organization = organization;
        this.wrappedDek = wrappedDek;
        this.dekKeyId = dekKeyId;
        this.createdAt = createdAt;
        this.algorithm = algorithm;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getOrganization() { return organization; }
    public void setOrganization(String organization) { this.organization = organization; }

    public String getWrappedDek() { return wrappedDek; }
    public void setWrappedDek(String wrappedDek) { this.wrappedDek = wrappedDek; }

    public String getDekKeyId() { return dekKeyId; }
    public void setDekKeyId(String dekKeyId) { this.dekKeyId = dekKeyId; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public String getAlgorithm() { return algorithm; }
    public void setAlgorithm(String algorithm) { this.algorithm = algorithm; }
}
