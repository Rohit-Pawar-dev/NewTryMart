import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { OrderService, Order } from '../../../services/order.service';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './order-list.component.html',
})
export class OrderListComponent implements OnInit {
  orders: Order[] = [];
  searchText = '';
  currentPage = 1;
  limit = 10;
  totalOrders = 0;
  totalPages = 0;
  status: string = 'all'; // default

  isLoading = false;

  constructor(
    private orderService: OrderService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      this.status = params.get('status') || 'all';
      this.currentPage = 1;
      this.fetchOrders();
    });
  }

  fetchOrders(): void {
    this.isLoading = true;
    const offset = (this.currentPage - 1) * this.limit;

    this.orderService.getAllOrders(this.searchText, this.limit, offset, this.status).subscribe({
      
      next: (res) => {
        this.orders = res.data;
        console.log('Fetched Orders:', this.orders);
        
        this.totalOrders = res.total;
        this.limit = res.limit;
        this.totalPages = res.totalPages;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.fetchOrders();
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.fetchOrders();
    }
  }
}
