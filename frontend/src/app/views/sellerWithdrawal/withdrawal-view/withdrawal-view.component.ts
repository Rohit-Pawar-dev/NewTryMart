import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-withdrawal-view',
  imports: [CommonModule],
  templateUrl: './withdrawal-view.component.html',
  styleUrls: ['./withdrawal-view.component.scss']
})
export class WithdrawalViewComponent implements OnInit {
  requestId!: string;
  request: any = null;
  loading = true;

  private apiUrl = `${environment.apiUrl}/withdrawal-requests`;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.requestId = this.route.snapshot.paramMap.get('id') || '';
    if (this.requestId) {
      this.getRequestDetails();
    } else {
      Swal.fire('Error', 'Invalid request ID', 'error');
    }
  }
  getRequestDetails(): void {
    this.loading = true;
    this.http.get<any>(`${this.apiUrl}/${this.requestId}`).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.status) {
          this.request = res.data;
        } else {
          Swal.fire('Error', res.message, 'error');
        }
      },
      error: () => {
        this.loading = false;
        Swal.fire('Error', 'Failed to load request details', 'error');
      }
    });
  }
}
