const API_BASE_URL = '/api';  // Use local proxy routes to avoid CORS issues

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  _id: string;
  email: string;
  fullName: string;
  role: 'superadmin' | 'pentester' | 'customer';
  companyName: string;
  companyRole: string;
  lastLogin: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

export class AuthError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'AuthError';
  }
}

export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  console.log('Making login request to:', `${API_BASE_URL}/auth/login`);
  
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  console.log('Login response status:', response.status);
  console.log('Login response headers:', response.headers);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Login error response:', errorText);
    
    // Provide more specific error messages based on status code
    switch (response.status) {
      case 401:
        throw new AuthError('Invalid credentials', response.status);
      case 404:
        throw new AuthError('Login endpoint not found. Check API URL.', response.status);
      case 500:
        throw new AuthError('Server error. Please try again later.', response.status);
      case 0:
        throw new AuthError('Network error. Check if API server is running.', response.status);
      default:
        throw new AuthError(`Login failed: ${response.status} ${response.statusText}`, response.status);
    }
  }

  return response.json();
}

export async function getMe(token: string): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new AuthError('Failed to get user information', response.status);
  }

  return response.json();
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('auth_token');
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem('auth_token', token);
}

export function removeToken(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem('auth_token');
  sessionStorage.removeItem('user_data');
}

export function getUser(): User | null {
  if (typeof window === 'undefined') return null;
  const userData = sessionStorage.getItem('user_data');
  return userData ? JSON.parse(userData) : null;
}

export function setUser(user: User): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem('user_data', JSON.stringify(user));
} 