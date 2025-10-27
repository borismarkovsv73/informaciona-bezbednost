export interface Certificate {
  id: number;
  commonName: string;
  organization: string;
  organizationalUnit: string;
  country: string;
  state: string;
  locality: string;
  serialNumber: string;
  type: 'SELF_SIGNED_ROOT' | 'INTERMEDIATE' | 'END_ENTITY';
  issuedAt: string;
  expiresAt: string;
  revoked: boolean;
  revokedAt?: string;
  issuerSerialNumber?: string;
  certificateData: string;
}

export interface CertificateRequest {
  commonName: string;
  organization: string;
  organizationalUnit: string;
  country: string;
  state: string;
  locality: string;
  type: 'SELF_SIGNED_ROOT' | 'INTERMEDIATE' | 'END_ENTITY';
  validityYears: number;
  issuerSerialNumber?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  username: string;
}