import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { map } from 'rxjs/operators';

export interface Category {
  _id?: string;
  name: string;
  image: string;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private apiUrl = `${environment.apiUrl}/categories`;

  constructor(private http: HttpClient) {}

  // getCategories(params: { search?: string; limit?: number; offset?: number } = {}): Observable<Category[]> {
  //   const query = new URLSearchParams({ all: 'true', ...params } as any).toString();
  //   return this.http.get<{ data: Category[] }>(`${this.apiUrl}?${query}`).pipe(
  //     map(response => response.data)
  //   );
  // }

  getCategories(params: { search?: string; limit?: number; offset?: number; all?: boolean } = {}): Observable<Category[]> {
    const query = new URLSearchParams({ ...params, all: params.all ? 'true' : undefined } as any).toString();
    return this.http.get<{ data: Category[] }>(`${this.apiUrl}?${query}`).pipe(
      map(response => response.data)
    );
  }


  getCategory(id: string): Observable<Category> {
    return this.http.get<Category>(`${this.apiUrl}/${id}`);
  }

  createCategory(category: Category): Observable<Category> {
    return this.http.post<Category>(this.apiUrl, category);
  }

  updateCategory(id: string, category: Partial<Category>): Observable<Category> {
    return this.http.put<Category>(`${this.apiUrl}/${id}`, category);
  }

  deleteCategory(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
