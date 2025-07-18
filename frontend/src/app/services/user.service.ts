import { Injectable } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface User {
  _id?: string;
  name: string;
  email: string;
  gender: string;
  mobile: string;
  password?: string;
  role: string;
  otp?: string;
  profilePicture: string;
  status: string;
  fcm_id?: string;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) { }

  getUsers(
    search: string = '',
    page: number = 1,
    pageSize: number = 10
  ): Observable<any> {
    const offset = (page - 1) * pageSize;
    const params = new URLSearchParams();

    if (search) params.append('search', search);
    params.append('offset', offset.toString());
    params.append('limit', pageSize.toString());

    return this.http.get<any>(`${this.apiUrl}/list?${params.toString()}`);
  }


  getUser(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/view/${id}`);
  }

  createUser(user: User): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/add`, user);
  }

  // updateUser(id: string, user: User): Observable<User> {
  //   return this.http.put<User>(`${this.apiUrl}/${id}`, user);
  // }

  updateUser(userId: string, user: Partial<User>) {
    return this.http.put(`${environment.apiUrl}/users/edit/${userId}`, user);
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${id}`);
  }
}
