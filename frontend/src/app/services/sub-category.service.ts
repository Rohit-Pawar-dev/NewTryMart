import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { map } from 'rxjs/operators';

export interface SubCategory {
  _id?: string;
  category_id: string | { _id: string; name: string };
  name: string;
  image: string;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}


@Injectable({
  providedIn: 'root',
})
export class SubCategoryService {
  private apiUrl = `${environment.apiUrl}/subcategories`;

  constructor(private http: HttpClient) {}

  getSubCategories(params: { search?: string; limit?: number; offset?: number } = {}): Observable<SubCategory[]> {
    const query = new URLSearchParams({ all: 'true', ...params } as any).toString();
    return this.http.get<{ data: SubCategory[] }>(`${this.apiUrl}?${query}`).pipe(
      map(response => response.data)
    );
  }

  getSubCategory(id: string): Observable<SubCategory> {
    return this.http.get<SubCategory>(`${this.apiUrl}/${id}`);
  }

  createSubCategory(subCategory: SubCategory): Observable<SubCategory> {
    return this.http.post<SubCategory>(this.apiUrl, subCategory);
  }

  updateSubCategory(id: string, subCategory: Partial<SubCategory>): Observable<SubCategory> {
    return this.http.put<SubCategory>(`${this.apiUrl}/${id}`, subCategory);
  }

  deleteSubCategory(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
