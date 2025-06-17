import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Product {
  _id?: string;
  name: string;
  slug: string;
  description?: string;
  thumbnail: string;
  images?: string[];
  category_id?: string;
  sub_category_id?: string;
  seller_id?: string | null;
  added_by?: 'admin' | 'seller';
  min_qty?: number;
  unit_price: number;
  purchase_price: number;
  tax?: number;
  discount?: number;
  discount_type?: 'flat' | 'percent';
  current_stock?: number;
  status?: number;
  request_status?: number;
  created_at?: string;
  sku_code?: string,
  unit?: string,
  updated_at?: string;
  variants?: {
    name: string;
    values: string[];
  }[];
}

export interface CategoryResponse {
  message: string;
  data: Category[];
  total: number;
  limit: number;
  offset: number;
  totalPages: number;
}

export interface Category {
  _id: string;
  name: string;
  image: string;
  status: string;
  created_at: string;
  updated_at: string;
  sub_categories: SubCategory[];
}

export interface SubCategory {
  _id: string;
  name: string;
  image: string;
  category_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = `${environment.apiUrl}/products`;
  private categoriesUrl = `${environment.apiUrl}/categories`;

  constructor(private http: HttpClient) {}

  /** Admin - Get all products */
  getAllProducts(params: { search?: string; limit?: number; offset?: number } = {}): Observable<any> {
    const query = new HttpParams({ fromObject: { ...params } });
    return this.http.get<any>(this.apiUrl, { params: query });
  }

  /** Admin - Get product by ID */
  getProductById(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }

  /** Admin - Create product */
  createProduct(product: Product | FormData): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, product);
  }

  /** Admin - Update product */
  updateProduct(id: string, product: Partial<Product> | FormData): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${id}`, product);
  }

  /** Admin - Delete product */
  deleteProduct(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  /** Admin - Get all categories and subcategories */
  getAllCategories(): Observable<CategoryResponse> {
    const params = new HttpParams().set('all', 'true');
    return this.http.get<CategoryResponse>(this.categoriesUrl, { params });
  }
}
