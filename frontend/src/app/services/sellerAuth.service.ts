import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SellerAuthService {
  private apiUrl = `${environment.apiUrl}/sellers`;

  constructor(private http: HttpClient) {}

  /**
   * Register a new seller with form data including image upload
   */
  registerSeller(sellerData: any, logoFile: File): Observable<any> {
    const formData = new FormData();
    for (const key in sellerData) {
      if (sellerData.hasOwnProperty(key)) {
        formData.append(key, sellerData[key]);
      }
    }
    if (logoFile) {
      formData.append('logo', logoFile);
    }

    return this.http.post(`${this.apiUrl}/register`, formData);
  }

  /**
   * Login seller using mobile number
   */
  loginSeller(mobile: string): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const body = JSON.stringify({ mobile });

    return this.http.post(`${this.apiUrl}/login`, body, { headers });
  }

  /**
   * Verify seller OTP
   */
  verifyOtp(mobile: string, otp: string): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const body = JSON.stringify({ mobile, otp });

    return this.http.post(`${this.apiUrl}/verify-otp`, body, { headers });
  }
}
