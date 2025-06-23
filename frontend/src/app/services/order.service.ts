import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Address {
  name: string;
  phone: string;
  city: string;
  pincode: string;
  address: string;
  [key: string]: any; // Optional fallback for any extra fields
}
export interface Order {
  _id?: string;
  customer_id?: {
    _id?: string;
    name: string;
    mobile: string;
    email?: string;
    profilePicture?: string;
  };
  seller_id?: {
    shop_name: string;
    mobile: string;
    // optionally:
    email?: string;
  };
  seller_is?: string;
  order_items?: any[];
  shipping_address: Address | string | null;
  total_price?: number;
  shipping_cost?: number;
  coupon_amount?: number;
  customer_order_count?: number;
  status?: string;
  payment_status?: string;
  payment_method?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private apiUrl = `${environment.apiUrl}/orders`;

  constructor(private http: HttpClient) {}

  // Get All Orders with search + pagination + status filter
  getAllOrders(
    search: string = '',
    limit: number = 10,
    offset: number = 0,
    status: string = 'all'
  ): Observable<{
    status: boolean;
    message: string;
    data: Order[];
    total: number;
    limit: number;
    offset: number;
    totalPages: number;
  }> {
    const params: any = {
      search,
      limit,
      offset,
    };

    if (status && status !== 'all') {
      params.status = status;
    }

    return this.http.get<any>(this.apiUrl, { params });
  }

  // Get Order by ID
  getOrderById(
    id: string
  ): Observable<{ status: boolean; message: string; data: Order }> {
    return this.http.get<{ status: boolean; message: string; data: Order }>(
      `${this.apiUrl}/${id}`
    );
  }
}
