import { Injectable, OnDestroy } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  throwError,
  interval,
  Subscription,
} from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { TokenService, JwtPayload } from './token.service';
import { HttpClient } from '@angular/common/http';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export interface TokenRefreshResponse {
  accessToken: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService implements OnDestroy {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<JwtPayload | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private tokenCheckInterval: Subscription | null = null;
  private readonly TOKEN_CHECK_INTERVAL = 60000; // Check every minute

  constructor(
    private http: HttpClient, // Use regular HttpClient, not your custom one
    private tokenService: TokenService,
    private router: Router,
  ) {
    this.loadTokens();
  }

  ngOnDestroy() {
    this.stopTokenCheck();
  }

  private loadTokens(): void {
    const accessToken = this.tokenService.getAccessToken();
    if (accessToken && !this.tokenService.isTokenExpired(accessToken)) {
      const decodedToken = this.tokenService.decodeToken(accessToken);
      this.currentUserSubject.next(decodedToken);
      this.startTokenCheck();
    }
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/login`, { email, password })
      .pipe(
        tap((response) => {
          this.setSession(response);
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
    const token = this.tokenService.getAccessToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    const payload = refreshToken ? { refreshToken } : {};

    return this.http
      .post<void>(`${this.apiUrl}/logout`, payload, { headers })
      .pipe(
        tap(() => {
          this.clearSession();
          this.router.navigate(['/login']);
        }),
        catchError((error) => {
          this.clearSession();
          this.router.navigate(['/login']);
          return this.handleError(error);
        }),
      );
  }

  refreshToken(): Observable<TokenRefreshResponse> {
    const refreshToken = this.tokenService.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    // TODO:
    return this.http
      .post<TokenRefreshResponse>(`${this.apiUrl}/refresh-token`, {
        refreshToken,
      })
      .pipe(
        tap((response) => {
          this.tokenService.setAccessToken(response.accessToken);
          const decodedToken = this.tokenService.decodeToken(
            response.accessToken,
          );
          if (decodedToken) {
            this.currentUserSubject.next(decodedToken);
          }
        }),
        catchError((error) => this.handleError(error)),
      );
  }

  /*signUp(userID: string, eventID: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.apiUrl}/${eventID}/signup`, {
      userID,
      eventID,
    });
  }*/


  private setSession(authResult: LoginResponse): void {
    this.tokenService.setAccessToken(authResult.accessToken);
    this.tokenService.setRefreshToken(authResult.refreshToken);

    const decodedToken = this.tokenService.decodeToken(authResult.accessToken);
    if (decodedToken) {
      this.currentUserSubject.next(decodedToken);
      this.startTokenCheck();
    } else {
      this.clearSession();
    }
  }

  clearSession(): void {
    this.tokenService.clearTokens();
    this.currentUserSubject.next(null);
    this.stopTokenCheck();
  }

  // Token check methods remain mostly the same, but use TokenService
  private startTokenCheck(): void {
    this.stopTokenCheck();
    this.tokenCheckInterval = interval(this.TOKEN_CHECK_INTERVAL).subscribe(
      () => {
        this.checkAndRefreshToken();
      },
    );
  }

  private stopTokenCheck(): void {
    if (this.tokenCheckInterval) {
      this.tokenCheckInterval.unsubscribe();
      this.tokenCheckInterval = null;
    }
  }

  private checkAndRefreshToken(): void {
    const accessToken = this.tokenService.getAccessToken();
    if (!accessToken) return;

    const decodedToken = this.tokenService.decodeToken(accessToken);
    if (!decodedToken) return;

    const expiresIn = decodedToken.exp * 1000 - Date.now();

    // If token will expire in the next 5 minutes, refresh it
    if (expiresIn < 300000) {
      this.refreshToken().subscribe({
        next: () => console.log('Token refreshed proactively'),
        error: (error) => console.error('Failed to refresh token:', error),
      });
    }
  }

  // Helper methods using TokenService
  isAuthenticated(): boolean {
    return this.tokenService.hasValidAccessToken();
  }

  getFullName(): string | null {
    const token = this.tokenService.getAccessToken();
    if (!token) return null;

    const decoded = this.tokenService.decodeToken(token);
    return decoded ? `${decoded.firstName} ${decoded.lastName}` : null;
  }

  getUserId(): string | null {
    const token = this.tokenService.getAccessToken();
    if (!token) return null;

    const decoded = this.tokenService.decodeToken(token);
    return decoded ? decoded.sub : null;
  }

  getfirstName(): string | null {
    const token = this.tokenService.getAccessToken();
    if (!token) return null;

    const decoded = this.tokenService.decodeToken(token);
    return decoded ? decoded.firstName : null;
  }

  getlastName(): string | null {
    const token = this.tokenService.getAccessToken();
    if (!token) return null;

    const decoded = this.tokenService.decodeToken(token);
    return decoded ? decoded.lastName : null;
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
