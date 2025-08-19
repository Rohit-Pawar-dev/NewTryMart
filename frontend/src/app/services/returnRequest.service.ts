import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ReturnRequest {
    _id: string;
    order_id: any;
    user_id: any;
    seller_id: any;
    reason: string;
    description?: string;
    proof_images?: string[];
    status: 'Pending' | 'Approved' | 'Denied' | 'Returned';
    admin_response?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ReturnRequestPagination {
    status: boolean;
    message: string;
    data: ReturnRequest[];
    total: number;
    limit: number;
    offset: number;
    totalPages: number;
}

@Injectable({
    providedIn: 'root',
})
export class ReturnRequestService {
    private apiUrl = `${environment.apiUrl}/return-requests`;

    constructor(private http: HttpClient) { }

    getAll(
        status?: string,
        search?: string,
        limit: number = 10,
        offset: number = 0
    ): Observable<ReturnRequestPagination> {
        let params = new HttpParams()
            .set('limit', limit.toString())
            .set('offset', offset.toString());

        if (status) params = params.set('status', status);
        if (search) params = params.set('search', search);

        return this.http.get<ReturnRequestPagination>(this.apiUrl, { params });
    }

    getById(id: string): Observable<{ status: boolean; data: ReturnRequest }> {
        return this.http.get<{ status: boolean; data: ReturnRequest }>(`${this.apiUrl}/${id}`);
    }

    changeStatus(
        id: string,
        status: 'Approved' | 'Denied' | 'Returned',
        admin_response?: string
    ): Observable<any> {
        return this.http.put(`${this.apiUrl}/${id}`, {
            status,
            admin_response,
        });
    }
}
