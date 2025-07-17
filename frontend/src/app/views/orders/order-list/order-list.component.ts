import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { OrderService, Order } from '../../../services/order.service';
// import { InvoiceComponent } from '../invoice/invoice.component';




@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './order-list.component.html',
})
export class OrderListComponent implements OnInit, OnChanges {
  @Input() status: string = 'all';

  orders: Order[] = [];
  searchText = '';
  currentPage = 1;
  limit = 10;
  totalOrders = 0;
  totalPages = 0;

  startDate?: string;
  endDate?: string;

  isLoading = false;

  statusOptions = [
    'Pending',
    'Confirmed',
    'Processing',
    'Shipped',
    'Delivered',
    'Cancelled',
    'Returned',
  ];

  constructor(
    private orderService: OrderService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    const initialStatus = this.route.snapshot.queryParamMap.get('status');
    if (initialStatus && initialStatus !== this.status) {
      this.status = initialStatus;
    }

    this.fetchOrders();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['status'] && !changes['status'].firstChange) {
      this.currentPage = 1;
      this.fetchOrders();
    }
  }

  fetchOrders(): void {
    this.isLoading = true;
    const offset = (this.currentPage - 1) * this.limit;

    // Basic validation: if both dates provided, ensure startDate <= endDate
    if (this.startDate && this.endDate && this.startDate > this.endDate) {
      alert('Start date cannot be later than end date.');
      this.isLoading = false;
      return;
    }

    this.orderService
      .getAllOrders(
        this.searchText.trim(),
        this.limit,
        offset,
        this.status,
        this.startDate,
        this.endDate
      )
      .subscribe({
        next: (res) => {
          this.orders = res.data ?? [];
          this.totalOrders = res.total ?? 0;
          this.limit = res.limit ?? this.limit;
          this.totalPages = res.totalPages ?? Math.ceil(this.totalOrders / this.limit);
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error fetching orders:', err);
          this.isLoading = false;
        },
      });
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.fetchOrders();
  }

  onStatusChange(): void {
    this.currentPage = 1;
    this.fetchOrders();

    this.router.navigate([], {
      queryParams: { status: this.status },
      queryParamsHandling: 'merge',
    });
  }

  onStartDateChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.startDate = value || undefined;
    this.currentPage = 1;
    this.fetchOrders();
  }

  onEndDateChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.endDate = value || undefined;
    this.currentPage = 1;
    this.fetchOrders();
  }

  clearDates(): void {
    this.startDate = undefined;
    this.endDate = undefined;
    this.currentPage = 1;
    this.fetchOrders();
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.fetchOrders();
    }
  }


}
