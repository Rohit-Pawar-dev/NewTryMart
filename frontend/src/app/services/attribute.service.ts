import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Attribute {
    _id?: string;
    type: 'color' | 'size';
    value: string;
    status?: 'active' | 'inactive';
}

@Injectable({
    providedIn: 'root',
})
export class AttributeService {
    private baseUrl = `${environment.apiUrl}/attributes`;

    constructor(private http: HttpClient) { }

    // Create a new attribute
    createAttribute(data: Attribute): Observable<any> {
        return this.http.post(`${this.baseUrl}/add`, data);
    }

    // Get all attributes
    getAllAttributes(): Observable<{ data: Attribute[] }> {
        return this.http.get<{ data: Attribute[] }>(`${this.baseUrl}/view`);
    }

    // Get attributes by type (color or size)
    getAttributesByType(type: 'color' | 'size'): Observable<{ data: Attribute[] }> {
        return this.http.get<{ data: Attribute[] }>(`${this.baseUrl}/view-by-type?type=${type}`);
    }

    // Delete an attribute
    deleteAttribute(id: string): Observable<any> {
        return this.http.delete(`${this.baseUrl}/delete/${id}`);
    }
}
