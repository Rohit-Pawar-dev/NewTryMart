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

  /**
   * Register a new seller with form data including image upload
   */
  registerSeller(sellerData: any): Observable<any> {
    // Just send JSON object directly
    return this.http.post(`${this.apiUrl}/register`, sellerData);
  }

  getBusinessCategories() {
    return this.http.get<{ status: boolean; data: any[] }>(`${environment.apiUrl}/business-categories`);
  }


  /**
   * OTP login for seller using mobile number
   * @param mobile The mobile number of the seller
   * @returns Observable with the server response
   */
  otploginSeller(mobile: string): Observable<any> {
    // No need to set Content-Type for JSON body, Angular handles it
    const body = { mobile };

    return this.http.post(`${this.apiUrl}/login/otp`, body);
  }

  /**
   * Verify OTP sent to the mobile number
   * @param mobile The mobile number of the seller
   * @param otp The OTP to verify
   * @returns Observable with the server response
   */
  verifyOtp(mobile: string, otp: string): Observable<any> {
    // No need for Content-Type header as Angular handles it automatically for JSON requests
    const body = { mobile, otp };

    return this.http.post(`${this.apiUrl}/verify-otp`, body);
  }

  /**
   * Login using email and password
   * @param email Email of the seller
   * @param password Password of the seller
   * @returns Observable with the server response
   */
  emailPasswordLogin(email: string, password: string): Observable<any> {
    const body = { email, password };

    return this.http.post(`${this.apiUrl}/login/email-password`, body);
  }

  /**
   * Login using mobile number and password
   * @param mobile Mobile number of the seller
   * @param password Password of the seller
   * @returns Observable with the server response
   */
  mobilePasswordLogin(mobile: string, password: string): Observable<any> {
    const body = { mobile, password };

    return this.http.post(`${this.apiUrl}/login/email-password`, body);
  }
}
