import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Address {
  _id?: string;
  name: string;
  phone?: string;
  mobile?: string;
  city: string;
  pincode: string;
  address: string;
  state?: string;
  landmark?: string;
  locality?: string;
  address_type?: string;
  [key: string]: any;
}

export interface UserLite {
  _id: string;
  name: string;
  email?: string;
  mobile: string;
  profilePicture?: string;
  role?: string;
}

export interface ProductDetail {
  _id: string;
  name: string;
  thumbnail: string;
  images: string[];
  unit_price: number;
  tax: number;
  discount: number;
  discount_type: string;
  description: string;
  sku_code: string;
  status: number;
}

export interface OrderItem {
  _id: string;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_detail: ProductDetail;
  thumbnail: string;
  tax: number;
  discount: number;
  discount_type: 'flat' | 'percentage';
  order_id: string;
}

export interface TransactionOrder {
  _id: string;
  customer_id: UserLite;
  seller_is: string;
  shipping_address: Address;
  total_price: number;
  order_items: OrderItem[];
  status: OrderStatus;
  payment_status: 'Unpaid' | 'Paid' | 'Refunded';
  payment_method: string;
  createdAt: string;
}

export interface Transaction {
  _id: string;
  order_id: TransactionOrder;
  user_id: UserLite;
  paid_by: UserLite;
  paid_to?: UserLite;
  payment_status: string;
  amount: number;
  createdAt: string;
}

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Returned'
  | 'Cancelled';

export interface Order {
  _id?: string;
  order_id?: number;
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
  seller_is?: string;
  order_items?: any[];
  shipping_address: Address | string | null;
  total_price?: number;
  shipping_cost?: number;
  coupon_amount?: number;
  customer_order_count?: number;
  /** ✅ required because backend always provides it */
  status: OrderStatus;
  /** ✅ required because backend always provides it */
  payment_status: 'Unpaid' | 'Paid' | 'Refunded';
  payment_method?: string;
  createdAt?: string;
  updatedAt?: string;
  breakdown: {
    subtotal: number;
    totalDiscount: number;
    totalTax: number;
    couponAmount: number;
    deliveryCharge: number;
    finalPayable: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private apiUrl = `${environment.apiUrl}/orders`;
  private transactionUrl = `${environment.apiUrl}/orders/transactions`;

  constructor(private http: HttpClient) {}

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

  getOrderById(id: string): Observable<{
    status: boolean;
    message: string;
    data: Order;
  }> {
    return this.http.get<{
      status: boolean;
      message: string;
      data: Order;
    }>(`${this.apiUrl}/${id}`);
  }

  getTransactions(
    search: string = '',
    limit: number = 10,
    offset: number = 0,
    status: string = '',
    startDate?: string,
    endDate?: string
  ): Observable<{
    status: boolean;
    message: string;
    data: Transaction[];
    total: number;
    limit: number;
    offset: number;
    totalPages: number;
  }> {
    let params = new HttpParams()
      .set('search', search)
      .set('limit', limit.toString())
      .set('offset', offset.toString());

    if (status) {
      params = params.set('status', status);
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
      data: Transaction[];
      total: number;
      limit: number;
      offset: number;
      totalPages: number;
    }>(this.transactionUrl, { params });
  }

  changePaymentStatus(
    orderId: string,
    payment_status: 'Unpaid' | 'Paid' | 'Refunded'
  ): Observable<{ status: boolean; message: string; order: Order }> {
    return this.http.post<{ status: boolean; message: string; order: Order }>(
      `${this.apiUrl}/${orderId}/paymentStatus`,
      { payment_status }
    );
  }

  changeOrderStatus(
    orderId: string,
    order_status: OrderStatus
  ): Observable<{ status: boolean; message: string; order: Order }> {
    return this.http.post<{ status: boolean; message: string; order: Order }>(
      `${this.apiUrl}/${orderId}/status`,
      { order_status }
    );
  }
}
