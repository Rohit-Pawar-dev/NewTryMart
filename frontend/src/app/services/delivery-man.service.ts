import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DeliveryMan {
  _id?: string;
  name: string;
  email: string;
  mobile: string;
  gender: 'male' | 'female' | 'other';
  address: string;
  image?: string;
  licenseNumber: string;
  licensePhoto?: string;
  identityProofPhoto?: string;
  isAvailable?: boolean;
  status?: 'active' | 'inactive' | 'suspended';
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class DeliveryManService {
  private apiUrl = `${environment.apiUrl}/delivery-men`;

  constructor(private http: HttpClient) { }

  getDeliveryMen(
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

  getDeliveryMan(id: string): Observable<DeliveryMan> {
    return this.http.get<DeliveryMan>(`${this.apiUrl}/${id}`);
  }

  createDeliveryMan(data: DeliveryMan): Observable<DeliveryMan> {
    return this.http.post<DeliveryMan>(this.apiUrl, data);
  }

  updateDeliveryMan(id: string, data: Partial<DeliveryMan>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  deleteDeliveryMan(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
