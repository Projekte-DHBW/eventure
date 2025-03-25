import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { HttpClientService } from './httpClient.service';

@Injectable({
  providedIn: 'root',
})
export class FileUploadService {
  constructor(private http: HttpClientService) {}

  uploadImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.authenticatedPost('uploads/images', formData);
  }

  deleteImage(filename: string): Observable<any> {
    return this.http.authenticatedDelete(`uploads/images/${filename}`);
  }
}
