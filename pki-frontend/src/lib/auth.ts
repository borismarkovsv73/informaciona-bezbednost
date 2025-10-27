import Cookies from 'js-cookie';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  username: string;
}

export class AuthService {
  static async login(credentials: LoginCredentials) {
    try {
      console.log('Attempting login to:', `${process.env.NEXT_PUBLIC_API_URL}/auth/login`);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
        // For development with self-signed certificates
        mode: 'cors',
        // Additional options for HTTPS with self-signed certificates
        cache: 'no-cache',
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Login failed:', response.status, errorText);
        throw new Error(`Login failed: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Login successful:', result);
      return result;
    } catch (error) {
      console.error('Login error details:', error);
      
      // Check if it's a network error (CORS, SSL, etc.)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Cannot connect to server. Please check if the backend is running on HTTPS.');
      }
      
      throw error;
    }
  }

  static setTokens(authResponse: AuthResponse) {
    Cookies.set('accessToken', authResponse.accessToken, { expires: 1 }); // 1 day
    Cookies.set('refreshToken', authResponse.refreshToken, { expires: 7 }); // 7 days
    Cookies.set('username', authResponse.username, { expires: 7 });
  }

  static logout() {
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    Cookies.remove('username');
  }

  static isAuthenticated(): boolean {
    return !!Cookies.get('accessToken');
  }

  static getUsername(): string | undefined {
    return Cookies.get('username');
  }
}

export default AuthService;