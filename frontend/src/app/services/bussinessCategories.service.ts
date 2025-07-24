import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface BusinessCategory {
  _id?: string;
  name: string;
  description?: string;
  status?: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryResponse {
  status: boolean;
  message: string;
  data: BusinessCategory[];
  total: number;
  limit: number;
  offset: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root',
})
export class BusinessCategoriesService {

   private baseUrl = `${environment.apiUrl}/business-categories`;

  constructor(private http: HttpClient) {}

  // Get categories with pagination and optional search
  getCategories(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: 'active' | 'inactive';
  }): Observable<CategoryResponse> {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.status) httpParams = httpParams.set('status', params.status);

    return this.http.get<CategoryResponse>(this.baseUrl, { params: httpParams });
  }

  // Create a new category
  createCategory(category: BusinessCategory): Observable<BusinessCategory> {
    return this.http.post<BusinessCategory>(this.baseUrl, category);
  }

  // Update a category by ID
  updateCategory(id: string, category: Partial<BusinessCategory>): Observable<BusinessCategory> {
    return this.http.put<BusinessCategory>(`${this.baseUrl}/${id}`, category);
  }

  // Delete a category by ID
  deleteCategory(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`);
  }
}
