import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // gives date, currency, titlecase pipes + ngClass
import { FormsModule } from '@angular/forms';   // gives [(ngModel)]
import { HttpClient, HttpParams, HttpClientModule } from '@angular/common/http';
import Swal from 'sweetalert2';
import { environment } from '../../../environments/environment';

interface WalletTransaction {
  _id: string;
  type: 'credit' | 'debit';
  amount: number;
  balanceAfter: number;
  description?: string;
  createdAt: string;
}

interface WalletTransactionResponse {
  status: boolean;
  message: string;
  data: WalletTransaction[];
  total: number;
  limit: number;
  offset: number;
  totalPages: number;
}

@Component({
  selector: 'app-wallet-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './wallet-transactions.component.html',
  styleUrls: ['./wallet-transactions.component.scss']
})
export class WalletTransactionsComponent implements OnInit {
  transactions: WalletTransaction[] = [];
  loading = false;
  error: string | null = null;

  // Pagination state
  limit = 10;
  offset = 0;
  total = 0;
  totalPages = 1;

  search = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadTransactions();
  }

  loadTransactions(): void {
    this.loading = true;
    this.error = null;

    let params = new HttpParams()
      .set('limit', this.limit)
      .set('offset', this.offset)
      .set('search', this.search);

    this.http.get<WalletTransactionResponse>(`${environment.apiUrl}/sellers/wallet/transactions`, { params })
      .subscribe({
        next: (res) => {
          if (res.status) {
            this.transactions = res.data;
            this.total = res.total;
            this.totalPages = res.totalPages;
          } else {
            this.error = res.message;
          }
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          console.error(err);
          Swal.fire('Error', 'Failed to load wallet transactions', 'error');
        }
      });
  }

  onSearch(): void {
    this.offset = 0;
    this.loadTransactions();
  }

  changePage(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.offset = page * this.limit;
    this.loadTransactions();
  }
}
