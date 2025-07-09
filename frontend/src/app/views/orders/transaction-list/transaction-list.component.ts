import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService, Transaction } from '../../../services/order.service'; // adjust path
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-transaction',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './transaction-list.component.html',
})
export class TransactionComponent implements OnInit {
  transactions: Transaction[] = [];
  isLoading = false;

  searchText = '';
  status = 'all';
  startDate = '';
  endDate = '';

  currentPage = 1;
  limit = 10;
  totalPages = 0;
  total = 0;

  statusOptions = ['Pending', 'Paid', 'Failed'];

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.fetchTransactions();
  }

  fetchTransactions(): void {
    this.isLoading = true;
    const offset = (this.currentPage - 1) * this.limit;

    this.orderService
      .getTransactions(
        this.searchText,
        this.limit,
        offset,
        this.status === 'all' ? '' : this.status,
        this.startDate,
        this.endDate
      )
      .subscribe({
        next: (res) => {
          this.transactions = res.data || [];
          this.total = res.total || 0;
          this.totalPages = Math.ceil(this.total / this.limit);
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Transaction fetch error:', err);
          this.isLoading = false;
        },
      });
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.fetchTransactions();
    }
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.fetchTransactions();
  }

  onStatusChange(): void {
    this.currentPage = 1;
    this.fetchTransactions();
  }

  onStartDateChange(event: Event): void {
    this.startDate = (event.target as HTMLInputElement).value;
    this.currentPage = 1;
    this.fetchTransactions();
  }

  onEndDateChange(event: Event): void {
    this.endDate = (event.target as HTMLInputElement).value;
    this.currentPage = 1;
    this.fetchTransactions();
  }

  clearDates(): void {
    this.startDate = '';
    this.endDate = '';
    this.fetchTransactions();
  }
}
