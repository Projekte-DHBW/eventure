import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';

export interface JwtPayload {
  sub: string;
  firstName: string;
  lastName: string;
  exp: number;
  iat: number;
}

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }
  
  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }
  
  setAccessToken(token: string): void {
    localStorage.setItem('accessToken', token);
  }
  
  setRefreshToken(token: string): void {
    localStorage.setItem('refreshToken', token);
  }
  
  clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
  
  isTokenExpired(token: string): boolean {
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      return decoded.exp * 1000 < Date.now();
    } catch (error) {
      return true;
    }
  }
  
  decodeToken(token: string): JwtPayload | null {
    try {
      return jwtDecode<JwtPayload>(token);
    } catch (error) {
      return null;
    }
  }
  
  hasValidAccessToken(): boolean {
    const token = this.getAccessToken();
    return !!token && !this.isTokenExpired(token);
  }
}