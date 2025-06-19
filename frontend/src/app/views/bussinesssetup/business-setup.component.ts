import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-business-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './business-setup.component.html',
})
export class BusinessSetupComponent implements OnInit {
  isLoading = true;
  error: string | null = null;
  success: string | null = null;

  originalData: any = {};
  business = {
    companyName: '',
    phone: '',
    companyEmail: '',
    companyAddress: '',
    country: '',
    timezone: ''
  };

  private apiUrl = `${environment.apiUrl}/business-setup`;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchBusinessSetup();
  }

  fetchBusinessSetup(): void {
    this.isLoading = true;
    this.error = null;

    this.http.get<any>(this.apiUrl).subscribe({
      next: (res) => {
        const data = res?.data;

        if (res?.status && data) {
          this.business = { ...data };
          this.originalData = { ...data };
        } else {
          this.error = 'Invalid response structure.';
          Swal.fire('Error', this.error, 'error');
        }

        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.error = 'Failed to load business setup information.';
        console.error('Fetch Error:', err);
        Swal.fire('Error', this.error, 'error');
      }
    });
  }

  onUpdate(): void {
    this.success = null;
    this.error = null;
    this.isLoading = true;

    this.http.put<any>(this.apiUrl, this.business).subscribe({
      next: () => {
        this.originalData = { ...this.business };
        this.isLoading = false;
        Swal.fire('Success', 'Business setup updated successfully.', 'success');
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err.error?.message || 'Failed to update business setup.';
        Swal.fire('Error', this.error ?? 'An unknown error occurred.', 'error');

      }
    });
  }

  onCancel(): void {
    this.business = { ...this.originalData };
    this.success = null;
    this.error = null;
  }
}
