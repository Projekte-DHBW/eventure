import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export interface TokenRefreshResponse {
  accessToken: string;
}

interface JwtPayload {
  sub: string;
  firstName: string;
  lastName: string;
  exp: number;
  iat: number;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  getEmail() {
    throw new Error('Method not implemented.');
  }
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<JwtPayload | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private http = inject(HttpClient);
  private router = inject(Router);

  constructor() {
    this.loadTokens();
  }

  private loadTokens(): void {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken && !this.isTokenExpired(accessToken)) {
      const decodedToken = jwtDecode<JwtPayload>(accessToken);
      this.currentUserSubject.next(decodedToken);
    }
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/login`, { email, password })
      .pipe(
        tap((response) => this.setSession(response)),
        catchError((error) => this.handleError(error)),
      );
  }

  register(
    firstName: string,
    lastName: string,
    email: string,
    password: string,
  ): Observable<{ success: boolean }> {
    return this.http
      .post<{ success: boolean }>(`${this.apiUrl}/register`, {
        firstName,
        lastName,
        email,
        password,
      })
      .pipe(catchError((error) => this.handleError(error)));
  }

  logout(refreshToken?: string): Observable<void> {
    const payload = refreshToken ? { refreshToken } : {};

    return this.http.post<void>(`${this.apiUrl}/logout`, payload).pipe(
      tap(() => {
        this.clearSession();
        this.router.navigate(['/login']);
      }),
      catchError((error) => this.handleError(error)),
    );
  }

  refreshToken(): Observable<TokenRefreshResponse> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http
      .post<TokenRefreshResponse>(`${this.apiUrl}/refresh-token`, {
        refreshToken,
      })
      .pipe(
        tap((response) => {
          localStorage.setItem('accessToken', response.accessToken);
          try {
            const decodedToken = jwtDecode<JwtPayload>(response.accessToken);
            this.currentUserSubject.next(decodedToken);
          } catch (error) {
            console.error('Failed to decode JWT token', error);
            this.clearSession();
          }
        }),
        catchError((error) => this.handleError(error)),
      );
  }

  private setSession(authResult: LoginResponse): void {
    localStorage.setItem('accessToken', authResult.accessToken);
    localStorage.setItem('refreshToken', authResult.refreshToken);

    try {
      const decodedToken = jwtDecode<JwtPayload>(authResult.accessToken);
      this.currentUserSubject.next(decodedToken);
    } catch (error) {
      console.error('Failed to decode JWT token', error);
      this.clearSession();
    }
  }

  private clearSession(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('accessToken');
    return !!token && !this.isTokenExpired(token);
  }

  getFullName(): string | null {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      return decoded.firstName + ' ' + decoded.lastName;
    } catch {
      return null;
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      return decoded.exp * 1000 < Date.now();
    } catch (error) {
      return true;
    }
  }

  getUserId(): string | null {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      return decoded.sub;
    } catch {
      return null;
    }
  }

  getfirstName(): string | null {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      return decoded.firstName;
    } catch {
      return null;
    }
  }

  getlastName(): string | null {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      return decoded.lastName;
    } catch {
      return null;
    }
  }

  private handleError(error: any): Observable<never> {
    let errorMessage = '';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      errorMessage = error.error?.message || 'Server error';
    }
    return throwError(() => new Error(errorMessage));
  }
}
