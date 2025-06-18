import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { map } from 'rxjs/operators';

export interface Banner {
  _id?: string;
  title: string;
  image: string;
  banner_type: string
  video: string
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root',
})
export class BannerService {
  private apiUrl = `${environment.apiUrl}/banners`;

  constructor(private http: HttpClient) {}

  getBanners(params: { search?: string; limit?: number; offset?: number } = {}): Observable<Banner[]> {
  const query = new URLSearchParams({ all: 'true', ...params } as any).toString();
  return this.http.get<{ data: Banner[] }>(`${this.apiUrl}?${query}`).pipe(
    map(response => response.data)
  );
}


  getBanner(id: string): Observable<Banner> {
    return this.http.get<Banner>(`${this.apiUrl}/${id}`);
  }

  createBanner(banner: Banner): Observable<Banner> {
    return this.http.post<Banner>(this.apiUrl, banner);
  }

  updateBanner(id: string, banner: Partial<Banner>): Observable<Banner> {
    return this.http.put<Banner>(`${this.apiUrl}/${id}`, banner);
  }

  deleteBanner(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
