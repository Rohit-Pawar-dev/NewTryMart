// src/app/services/admin-profile.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
@Injectable({ providedIn: 'root' })
export class AdminProfileService {
  private apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) { }

  getAdminById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/edit/${id}`);
  }

  updateAdmin(id: string, formData: FormData): Observable<any> {
    return this.http.put(`${this.apiUrl}/update/${id}`, formData);
  }

  changePassword(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/change-password/${id}`, data);
  }
}
