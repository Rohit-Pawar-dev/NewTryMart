import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { IconComponent } from '@coreui/icons-angular';
import { environment } from '../../../../environments/environment';
import {
  CardBodyComponent,
  CardGroupComponent,
  CardComponent,
  ContainerComponent,
  RowComponent,
  ColComponent,
  InputGroupComponent,
  InputGroupTextDirective,
  FormControlDirective,
  ButtonDirective,
  FormDirective,
} from '@coreui/angular';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    ContainerComponent,
    RowComponent,
    ColComponent,
    CardComponent,
    CardBodyComponent,
    CardGroupComponent,
    InputGroupComponent,
    InputGroupTextDirective,
    FormControlDirective,
    ButtonDirective,
    FormDirective,
    IconComponent,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  emailOrMobile = '';

  password = '';
  error = '';

  constructor(private http: HttpClient, private router: Router) {}

  onLogin() {
    this.error = '';

    this.http.post<any>(`${environment.apiUrl}/admin/login`, {
      emailOrMobile: this.emailOrMobile,
      password: this.password,
    }).subscribe({
      next: (res) => {
        if (!res.status || !res.data) {
          this.error = 'Invalid login response';
          return;
        }

        localStorage.setItem('token', res.token);
        localStorage.setItem('profile', JSON.stringify(res.data));
        this.router.navigate(['/admin/dashboard']);
      },
      error: (err) => {
        this.error = err.error?.message || 'Login failed';
      }
    });
  }
}
