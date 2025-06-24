import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Address {
  name: string;
  phone: string;
  city: string;
  pincode: string;
  address: string;
  [key: string]: any;
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
    email?: string;
  };
  seller_is?: string; // enum: 'admin' | 'seller'
  order_items?: any[];
  shipping_address: Address | string | null;
  total_price?: number;
  shipping_cost?: number;
  coupon_amount?: number;
  customer_order_count?: number;
  status?: string; // enum in backend schema
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

  /**
   * Get all orders with optional filters, pagination, and date range.
   *
   * @param search search text (default empty string)
   * @param limit items per page (default 10)
   * @param offset pagination offset (default 0)
   * @param status order status filter (default 'all' means no filtering)
   * @param startDate filter orders created on or after this date (ISO string)
   * @param endDate filter orders created on or before this date (ISO string)
   * @returns observable with orders and pagination data
   */
  getAllOrders(
    search: string = '',
    limit: number = 10,
    offset: number = 0,
    status: string = 'all',
    startDate?: string,
    endDate?: string
  ): Observable<{
    status: boolean;
    message: string;
    data: Order[];
    total: number;
    limit: number;
    offset: number;
    totalPages: number;
  }> {
    let params = new HttpParams()
      .set('search', search)
      .set('limit', limit.toString())
      .set('offset', offset.toString());

    if (status && status.toLowerCase() !== 'all') {
      params = params.set('order_status', status);
    }

    if (startDate) {
      params = params.set('startDate', startDate);
    }
    if (endDate) {
      params = params.set('endDate', endDate);
    }

    return this.http.get<{
      status: boolean;
      message: string;
      data: Order[];
      total: number;
      limit: number;
      offset: number;
      totalPages: number;
    }>(this.apiUrl, { params });
  }

  /**
   * Get order details by ID.
   * Backend returns enriched data including customer_order_count and nested population.
   *
   * @param id Order ID
   * @returns observable with order data
   */
  getOrderById(id: string): Observable<{ status: boolean; message: string; data: Order }> {
    return this.http.get<{ status: boolean; message: string; data: Order }>(`${this.apiUrl}/${id}`);
  }
}
