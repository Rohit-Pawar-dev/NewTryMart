import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { environment } from '../../../environments/environment';


@Component({
  selector: 'app-bank-info',
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  standalone: true,
  templateUrl: './bank-info.component.html',
})
export class BankInfoComponent implements OnInit {
  bankForm!: FormGroup;
  sellerId = '68821bcd66e3734e4a9f7ea9';
  loading = false;

  constructor(private fb: FormBuilder, private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('seller_token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  ngOnInit(): void {
    this.bankForm = this.fb.group({
      account_holder_name: ['', Validators.required],
      bank_name: ['', Validators.required],
      account_number: ['', Validators.required],
      ifsc_code: ['', Validators.required],
      branch_name: [''],
      upi_id: [''],
    });

    this.loadBankInfo();
  }

  loadBankInfo(): void {
    this.loading = true;
    this.http
      .get<any>(`${environment.apiUrl}/sellers/bank-info/details`, {
        headers: this.getAuthHeaders()
      })
      .subscribe({
        next: (res) => {
          if (res?.status && res.data) {
            this.bankForm.patchValue(res.data);
          }
        },
        error: (err) => {
          console.error('Error loading bank info', err);
        },
        complete: () => {
          this.loading = false;
        },
      });
  }

  onSubmit(): void {
    if (this.bankForm.invalid) return;

    this.http
      .put<any>(`${environment.apiUrl}/sellers/bank-info/details`, this.bankForm.value, {
        headers: this.getAuthHeaders()
      })
      .subscribe({
        next: (res) => {
          if (res?.status) {
            Swal.fire('Success', res.message || 'Bank info saved', 'success');
          } else {
            Swal.fire('Error', res.message || 'Failed to save', 'error');
          }
        },
        error: (err) => {
          console.error('Error saving bank info', err);
          Swal.fire('Error', err.error?.message || 'Server error', 'error');
        },
      });
  }
}
