import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../auth/services/auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class HttpClientService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  /**
   * Make an HTTP request without authentication
   * @param method HTTP method
   * @param endpoint API endpoint (will be appended to base URL)
   * @param options Request options
   * @returns Observable of the response
   */
  public request<T>(
    method: string,
    endpoint: string,
    options: {
      body?: any;
      headers?: HttpHeaders | { [header: string]: string | string[] };
      params?:
        | HttpParams
        | {
            [param: string]:
              | string
              | string[]
              | number
              | boolean
              | readonly (string | number | boolean)[];
          };
    } = {},
  ): Observable<T> {
    const url = this.buildUrl(endpoint);
    return this.http
      .request<T>(method, url, options)
      .pipe(catchError((error) => this.handleError(error)));
  }

  /**
   * Make an authenticated HTTP request (adds Authorization header)
   * @param method HTTP method
   * @param endpoint API endpoint (will be appended to base URL)
   * @param options Request options
   * @returns Observable of the response
   */
  public authenticatedRequest<T>(
    method: string,
    endpoint: string,
    options: {
      body?: any;
      headers?: HttpHeaders | { [header: string]: string | string[] };
      params?:
        | HttpParams
        | {
            [param: string]:
              | string
              | string[]
              | number
              | boolean
              | readonly (string | number | boolean)[];
          };
      handleRefresh?: boolean;
    } = {},
  ): Observable<T> {
    const url = this.buildUrl(endpoint);
    const headers = this.addAuthHeader(options.headers || {});

    const requestOptions = {
      ...options,
      headers,
    };

    return this.http.request<T>(method, url, requestOptions).pipe(
      catchError((error) => {
        if (error.status === 401 && options.handleRefresh !== false) {
          return this.handleUnauthorizedError<T>(method, url, requestOptions);
        }
        return this.handleError(error);
      }),
    );
  }

  public get<T>(
    endpoint: string,
    options: {
      params?: any;
      headers?: any;
    } = {},
  ): Observable<T> {
    return this.request<T>('GET', endpoint, options);
  }

  public authenticatedGet<T>(
    endpoint: string,
    options: {
      params?: any;
      headers?: any;
      handleRefresh?: boolean;
    } = {},
  ): Observable<T> {
    return this.authenticatedRequest<T>('GET', endpoint, options);
  }

  public post<T>(
    endpoint: string,
    body: any,
    options: {
      params?: any;
      headers?: any;
    } = {},
  ): Observable<T> {
    return this.request<T>('POST', endpoint, { ...options, body });
  }

  public authenticatedPost<T>(
    endpoint: string,
    body: any,
    options: {
      params?: any;
      headers?: any;
      handleRefresh?: boolean;
    } = {},
  ): Observable<T> {
    return this.authenticatedRequest<T>('POST', endpoint, { ...options, body });
  }

  public put<T>(
    endpoint: string,
    body: any,
    options: {
      params?: any;
      headers?: any;
    } = {},
  ): Observable<T> {
    return this.request<T>('PUT', endpoint, { ...options, body });
  }

  public authenticatedPut<T>(
    endpoint: string,
    body: any,
    options: {
      params?: any;
      headers?: any;
      handleRefresh?: boolean;
    } = {},
  ): Observable<T> {
    return this.authenticatedRequest<T>('PUT', endpoint, { ...options, body });
  }

  public patch<T>(
    endpoint: string,
    body: any,
    options: {
      params?: any;
      headers?: any;
    } = {},
  ): Observable<T> {
    return this.request<T>('PATCH', endpoint, { ...options, body });
  }

  public authenticatedPatch<T>(
    endpoint: string,
    body: any,
    options: {
      params?: any;
      headers?: any;
      handleRefresh?: boolean;
    } = {},
  ): Observable<T> {
    return this.authenticatedRequest<T>('PATCH', endpoint, {
      ...options,
      body,
    });
  }

  public delete<T>(
    endpoint: string,
    options: {
      params?: any;
      headers?: any;
    } = {},
  ): Observable<T> {
    return this.request<T>('DELETE', endpoint, options);
  }

  public authenticatedDelete<T>(
    endpoint: string,
    options: {
      params?: any;
      headers?: any;
      handleRefresh?: boolean;
    } = {},
  ): Observable<T> {
    return this.authenticatedRequest<T>('DELETE', endpoint, options);
  }

  private buildUrl(endpoint: string): string {
    if (endpoint.startsWith('http')) {
      return endpoint;
    }
    const path = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${environment.apiUrl}/${path}`;
  }

  private addAuthHeader(headers: any): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    let httpHeaders = new HttpHeaders(headers);

    if (token) {
      httpHeaders = httpHeaders.set('Authorization', `Bearer ${token}`);
    }

    return httpHeaders;
  }

  private handleUnauthorizedError<T>(
    method: string,
    url: string,
    options: any,
  ): Observable<T> {
    //@ts-ignore
    return this.authService.refreshToken().pipe(
      switchMap((response) => {
        const headers = new HttpHeaders(options.headers);
        const updatedHeaders = headers.set(
          'Authorization',
          `Bearer ${response.accessToken}`,
        );
        const updatedOptions = {
          ...options,
          headers: updatedHeaders,
        };

        return this.http.request<T>(method, url, updatedOptions);
      }),
      catchError((error) => {
        this.authService.logout();
        return this.handleError(error);
      }),
    );
  }

  private handleError(error: any): Observable<never> {
    let errorMessage = '';
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      errorMessage = error.error?.message || 'Server error';
    }
    return throwError(() => new Error(errorMessage));
  }
}
