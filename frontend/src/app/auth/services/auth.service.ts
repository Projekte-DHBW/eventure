import { Injectable, inject, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, interval, Subscription } from 'rxjs';
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
export class AuthService implements OnDestroy {
  getEmail() {
    throw new Error('Method not implemented.');
  }
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<JwtPayload | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private http = inject(HttpClient);
  private router = inject(Router);

  private tokenCheckInterval: Subscription | null = null;
  private readonly TOKEN_CHECK_INTERVAL = 60000; // Check every minute

  constructor() {
    this.loadTokens();
  }

  ngOnDestroy() {
    this.stopTokenCheck();
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
        tap((response) => {
          this.setSession(response);
          // The setSession will now handle starting token check
        }),
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
      // Start token refresh checker when user logs in
      this.startTokenCheck();
    } catch (error) {
      console.error('Failed to decode JWT token', error);
      this.clearSession();
    }
  }

  private clearSession(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    this.currentUserSubject.next(null);
    this.stopTokenCheck();
  }

  // Start checking token expiration periodically
  private startTokenCheck(): void {
    this.stopTokenCheck();
    this.tokenCheckInterval = interval(this.TOKEN_CHECK_INTERVAL).subscribe(() => {
      this.checkAndRefreshToken();
    });
  }

  // Stop checking token expiration
  private stopTokenCheck(): void {
    if (this.tokenCheckInterval) {
      this.tokenCheckInterval.unsubscribe();
      this.tokenCheckInterval = null;
    }
  }

  // Check if token needs refreshing and refresh if needed
  private checkAndRefreshToken(): void {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return;

    try {
      const decoded = jwtDecode<JwtPayload>(accessToken);
      const expiresIn = decoded.exp * 1000 - Date.now();
      
      // If token will expire in the next 5 minutes, refresh it
      if (expiresIn < 300000) {
        this.refreshToken().subscribe({
          next: () => console.log('Token refreshed proactively'),
          error: (error) => console.error('Failed to refresh token:', error)
        });
      }
    } catch (error) {
      console.error('Error checking token expiration:', error);
    }
  }

  // Add a method to initialize auth state on app startup
  initAuth(): void {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      try {
        const decoded = jwtDecode<JwtPayload>(accessToken);
        this.currentUserSubject.next(decoded);
        
        // Start the token check mechanism
        this.startTokenCheck();
        
        // Immediately check if we need to refresh on startup
        this.checkAndRefreshToken();
      } catch (error) {
        console.error('Failed to decode JWT token on init', error);
        this.clearSession();
      }
    }
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
