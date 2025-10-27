# PKI Management System

A complete Public Key Infrastructure (PKI) management system built with Spring Boot backend and Next.js frontend, featuring HTTPS communication with PKI-generated certificates.

## Features

### Backend (Spring Boot)
- **Certificate Management**: Create self-signed, intermediate, and end-entity certificates
- **Secure Authentication**: JWT-based authentication with access and refresh tokens
- **Private Key Encryption**: Master key encryption for private key storage
- **Certificate Operations**: View, revoke, and download certificates
- **Keystore Export**: PKCS12 and JKS format support
- **HTTPS Communication**: Secured with PKI-generated SSL certificates

### Frontend (Next.js)
- **Admin Authentication**: Secure login with token management
- **Certificate Dashboard**: Overview of PKI infrastructure
- **Certificate Management**: Create, view, and manage certificates
- **Download Certificates**: Export certificates with private keys as keystores
- **Responsive UI**: Modern, responsive design with Tailwind CSS
- **HTTPS Proxy**: Seamless communication with HTTPS backend

## Prerequisites

- Java 17 or higher
- Node.js 18 or higher
- Maven 3.6 or higher
- npm or yarn

## Quick Start

### 1. Start Backend (HTTPS)
```powershell
.\mvnw.cmd clean spring-boot:run
```
Backend will run on `https://localhost:8443`

### 2. Start Frontend
```bash
npm run dev:pki    
```
Frontend will run on `https://localhost:3000`

### 3. Access the Application
- Open `https://localhost:3000`
- Login with: `admin` / `admin123`
- Start creating certificates through the PKI system

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout

### Certificates
- `GET /api/certificates` - List all certificates
- `POST /api/certificates` - Create new certificate
- `GET /api/certificates/{serialNumber}` - Get certificate details
- `POST /api/certificates/{serialNumber}/revoke` - Revoke certificate
- `GET /api/certificates/{serialNumber}/download/{format}` - Download keystore

## Certificate Types

1. **Self-Signed Root CA**: Root certificate authority
2. **Intermediate CA**: Intermediate certificate authority (requires root CA)
3. **End Entity**: End-user certificates (requires CA certificate)

## Security Features

- **HTTPS Only**: All communication over SSL/TLS using PKI certificates
- **JWT Authentication**: Secure token-based authentication
- **Private Key Encryption**: AES encryption for stored private keys
- **Access Control**: Role-based authorization
- **Certificate Validation**: Proper certificate chain validation

## Default Credentials

- **Username**: `admin`
- **Password**: `admin123`

## License

This project is for educational and demonstration purposes.