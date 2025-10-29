package com.pki.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class CertificateRequest {
    @NotBlank
    private String commonName;

    @NotBlank
    private String organization;

    @NotBlank
    private String organizationalUnit;

    @NotBlank
    private String country;

    @NotBlank
    private String state;

    @NotBlank
    private String locality;

    @NotNull
    private String type; // SELF_SIGNED_ROOT, INTERMEDIATE, END_ENTITY

    @Min(1)
    private int validityYears = 1;

    private String issuerSerialNumber; // Required for INTERMEDIATE and END_ENTITY

    public CertificateRequest() {}

    public String getCommonName() {
        return commonName;
    }

    public void setCommonName(String commonName) {
        this.commonName = commonName;
    }

    public String getOrganization() {
        return organization;
    }

    public void setOrganization(String organization) {
        this.organization = organization;
    }

    public String getOrganizationalUnit() {
        return organizationalUnit;
    }

    public void setOrganizationalUnit(String organizationalUnit) {
        this.organizationalUnit = organizationalUnit;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getLocality() {
        return locality;
    }

    public void setLocality(String locality) {
        this.locality = locality;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public int getValidityYears() {
        return validityYears;
    }

    public void setValidityYears(int validityYears) {
        this.validityYears = validityYears;
    }

    public String getIssuerSerialNumber() {
        return issuerSerialNumber;
    }

    public void setIssuerSerialNumber(String issuerSerialNumber) {
        this.issuerSerialNumber = issuerSerialNumber;
    }
}