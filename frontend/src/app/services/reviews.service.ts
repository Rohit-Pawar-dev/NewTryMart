import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Review {
  _id?: string;
  product_id: any; // You can replace `any` with a proper Product interface if available
  order_id: string;
  user_id: any; // Same here, replace `any` with a proper User interface if available
  comment: string;
  rating: number;
  status: 'active' | 'inactive';
  image?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ReviewsService {
  private apiUrl = `${environment.apiUrl}/review`;

  constructor(private http: HttpClient) {}

  // Fetch all reviews with optional query params (pagination or search)
  getReviews(params: { search?: string; limit?: number; offset?: number } = {}): Observable<Review[]> {
    const query = new URLSearchParams({ ...params } as any).toString();
    return this.http.get<{ data: Review[] }>(`${this.apiUrl}?${query}`).pipe(
      map(response => response.data)
    );
  }

  // Get a single review by ID
  getReview(id: string): Observable<Review> {
    return this.http.get<Review>(`${this.apiUrl}/${id}`);
  }

  // Create a new review
  createReview(review: Partial<Review>): Observable<Review> {
    return this.http.post<Review>(this.apiUrl, review);
  }

  // Update an existing review
  updateReview(id: string, review: Partial<Review>): Observable<Review> {
    return this.http.put<Review>(`${this.apiUrl}/${id}`, review);
  }

  // Delete a review
  deleteReview(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
