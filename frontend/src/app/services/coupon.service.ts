import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { map } from 'rxjs/operators';

export interface Coupon {
  _id?: string;
  couponTitle: string;
  couponCode: string;
  discountType: 'flat' | 'percent';
  discountAmount: number;
  minimumPurchase: number;
  startDate: string;
  expireDate: string;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CouponService {
  private apiUrl = `${environment.apiUrl}/coupons`;

  constructor(private http: HttpClient) { }

  getCoupons(params: { search?: string; limit?: number; offset?: number } = {}): Observable<{ data: Coupon[], total: number, limit: number, offset: number }> {
    const query = new URLSearchParams({ all: 'true', ...params } as any).toString();
    return this.http.get<{ data: Coupon[], total: number, limit: number, offset: number }>(`${this.apiUrl}?${query}`);
  }

  getCoupon(id: string): Observable<Coupon> {
    return this.http.get<Coupon>(`${this.apiUrl}/${id}`);
  }

  createCoupon(coupon: Coupon): Observable<Coupon> {
    return this.http.post<Coupon>(this.apiUrl, coupon);
  }

  updateCoupon(id: string, coupon: Partial<Coupon>): Observable<Coupon> {
    return this.http.put<Coupon>(`${this.apiUrl}/${id}`, coupon);
  }

  deleteCoupon(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
