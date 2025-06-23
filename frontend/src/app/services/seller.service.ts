import { Injectable } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Seller {
  _id?: string;
  name: string;
  gender?: string;
  mobile: string;
  email: string;
  password?: string;
  role: string;
  otp?: string;
  shop_name: string;
  address?: string;
  country?: string;
  state?: string;
  city?: string;
  pincode?: string;
  business_category: string;
  gst_number?: string;
  gst_registration_type?: string;
  gst_verified?: boolean;
  logo: string;
  profile_image: string;
  profilePicture?: string;
  status: string;
  fcm_id?: string;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SellerService {
  private apiUrl = `${environment.apiUrl}/sellers`;

  constructor(private http: HttpClient) {}

  getSellers(
    search: string = '',
    page: number = 1,
    pageSize: number = 10
  ): Observable<any> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());

    return this.http.get<any>(`${this.apiUrl}?${params.toString()}`);
  }

  getSeller(id: string): Observable<Seller> {
    return this.http.get<Seller>(`${this.apiUrl}/${id}`);
  }

  createSeller(seller: Seller): Observable<Seller> {
    return this.http.post<Seller>(this.apiUrl, seller);
  }

  updateSeller(sellerId: string, seller: Partial<Seller>) {
    return this.http.put(`${this.apiUrl}/${sellerId}`, seller);
  }

  deleteSeller(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
