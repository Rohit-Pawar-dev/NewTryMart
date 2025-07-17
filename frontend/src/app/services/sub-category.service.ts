import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { map } from 'rxjs/operators';
import { HttpClient, HttpParams } from '@angular/common/http';
export interface SubCategory {
  _id?: string;
  category_id: string | { _id: string; name: string };
  name: string;
  image: string;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}
export interface SubCategoryResponse {
  message: string;
  data: SubCategory[];
  total: number;
  limit: number;
  offset: number;
  totalPages: number;
}




@Injectable({
  providedIn: 'root',
})
export class SubCategoryService {
  private apiUrl = `${environment.apiUrl}/subcategories`;

  constructor(private http: HttpClient) { }

  // getSubCategories(params: { search?: string; limit?: number; offset?: number } = {}): Observable<SubCategory[]> {
  //   const query = new URLSearchParams({ all: 'true', ...params } as any).toString();
  //   return this.http.get<{ data: SubCategory[] }>(`${this.apiUrl}?${query}`).pipe(
  //     map(response => response.data)
  //   );
  // }
  getSubCategories(params: {
    search?: string;
    page?: number;
    pageSize?: number;
    all?: boolean; // to get all statuses (active + inactive)
  } = {}): Observable<SubCategoryResponse> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const offset = (page - 1) * pageSize;

    let httpParams = new HttpParams()
      .set('limit', pageSize.toString())
      .set('offset', offset.toString());

    if (params.search) {
      httpParams = httpParams.set('search', params.search);
    }

    if (params.all) {
      httpParams = httpParams.set('all', 'true');
    }
    // No need to set 'all' to false explicitly, backend handles default

    return this.http.get<SubCategoryResponse>(this.apiUrl, { params: httpParams });
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
