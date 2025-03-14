import { Injectable } from '@angular/core';
import { HttpClientService } from './httpClient.service';
import { Observable, throwError, timeout } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class OpenaiService {
  constructor(private http: HttpClientService) {}

  enhance(text: string, title: string, category: string): Observable<string> {
    return this.http.authenticatedGet<string>('openai/enhance', {
      params: { text, title, category }
    }).pipe(
      timeout({
        each: 30000,
        with: () => throwError(() => new HttpErrorResponse({
          error: 'Request timed out',
          status: 408,
          statusText: 'Request Timeout'
        }))
      })
    );
  }
}
