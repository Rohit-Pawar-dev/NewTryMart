import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Order {
  _id?: string;
  customer_id?: {
    _id?: string;
    name: string;
    mobile: string;
    email?: string;
  };
  order_items?: any[];
  shipping_address?: string;
  total_price?: number;
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
  getOrderById(id: string): Observable<{ status: boolean; message: string; data: Order }> {
  return this.http.get<{ status: boolean; message: string; data: Order }>(`${this.apiUrl}/${id}`);
}

}
