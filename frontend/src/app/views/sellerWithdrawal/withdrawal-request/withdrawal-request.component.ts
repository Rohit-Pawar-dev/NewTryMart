import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import { environment } from '../../../../environments/environment';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-withdrawal-request',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './withdrawal-request.component.html',
  styleUrls: ['./withdrawal-request.component.scss']
})
export class WithdrawalRequestComponent implements OnInit {
  requests: any[] = [];
  page = 1;
  limit = 10;
  totalPages = 1;
  search = '';
  statusFilter = '';

  private apiUrl = `${environment.apiUrl}/withdrawal-requests`;

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.fetchRequests();
  }

  fetchRequests(): void {
    const params: any = { page: this.page, limit: this.limit };
    if (this.search.trim()) params.search = this.search.trim();
    if (this.statusFilter) params.status = this.statusFilter;

    this.http.get<any>(this.apiUrl, { params }).subscribe({
      next: (res) => {

        if (res.status) {
          this.requests = res.data;
          this.totalPages = res.meta?.totalPages || 1;
        } else {
          Swal.fire('Error', res.message || 'Failed to fetch withdrawal requests', 'error');
        }
      },
      error: () => Swal.fire('Error', 'Failed to fetch withdrawal requests', 'error')
    });
  }

  updateStatus(id: string, status: string): void {
    Swal.fire({
      title: `Update Status to ${status}?`,
      input: 'text',
      inputLabel: 'Admin Note (optional)',
      showCancelButton: true,
      confirmButtonText: 'Yes, update',
      preConfirm: (note) => {
        return this.http.put<any>(`${this.apiUrl}/${id}`, { status, admin_note: note }).toPromise()
          .catch((err) => {
            Swal.showValidationMessage(err.error?.message);
            return null;
          });
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const res = result.value;
        if (res?.status) {
          Swal.fire('Success', res.message, 'success').then(() => {
            this.fetchRequests();
          });
        } else {
          Swal.fire('Error', res?.message || 'Failed to update status', 'error').then(() => {
            this.fetchRequests();
          });
        }
      }
    });
  }

  changePage(newPage: number): void {
    if (newPage < 1 || newPage > this.totalPages) return;
    this.page = newPage;
    this.fetchRequests();
  }
}
