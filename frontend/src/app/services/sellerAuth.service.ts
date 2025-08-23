import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SellerAuthService {
  private apiUrl = `${environment.apiUrl}/sellers`;
  public uploadLogoUrl = `${this.apiUrl}/upload/logo`;
  private uploadProfileImageUrl = `${this.apiUrl}/upload/profile-image`;
  constructor(private http: HttpClient) { }

  registerSeller(sellerData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, sellerData);
  }

  getBusinessCategories() {
    return this.http.get<{ status: boolean; data: any[] }>(`${environment.apiUrl}/business-categories`);
  }

  otploginSeller(mobile: string): Observable<any> {
    const body = { mobile };
    return this.http.post(`${this.apiUrl}/login/otp`, body);
  }

  verifyOtp(mobile: string, otp: string): Observable<any> {
    const body = { mobile, otp };
    return this.http.post(`${this.apiUrl}/verify-otp`, body);
  }

  emailPasswordLogin(email: string, password: string): Observable<any> {
    const body = { email, password };
    return this.http.post(`${this.apiUrl}/login/email-password`, body);
  }

  mobilePasswordLogin(mobile: string, password: string): Observable<any> {
    const body = { mobile, password };
    return this.http.post(`${this.apiUrl}/login/email-password`, body);
  }

  getSellerProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/view`);
  }

  updateSellerProfile(data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/edit`, data);
  }

  changePassword(oldPassword: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/change-password`, { oldPassword, newPassword });
  }

  getSellerId(): string | null {
    const profile = localStorage.getItem('seller_profile');
    try {
      return profile ? JSON.parse(profile).id : null;
    } catch (e) {
      console.error('Invalid seller_profile JSON in localStorage:', e);
      return null;
    }
  }

  getSellerProducts(params: any = {}): Observable<any> {
    return this.http.get(`${this.apiUrl}/products`, { params });
  }

  updateProductStatus(data: {
    id: string;
    status: number;
  }): Observable<{ success: number }> {
    return this.http.post<{ success: number }>(
      `${this.apiUrl}/products/status`,
      data
    );
  }

}
