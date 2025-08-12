import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SellerOrderService, Order, Address } from '../../../services/seller-order.service';

@Component({
  selector: 'app-order-view',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './order-view.component.html',
})
export class OrderViewComponent implements OnInit {
  orderId: string = '';
  order: Order | null = null;
  isLoading = true;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private sellerOrderService: SellerOrderService
  ) {}

  ngOnInit(): void {
    this.orderId = this.route.snapshot.paramMap.get('id') || '';
    if (this.orderId) {
      this.loadOrder();
    } else {
      this.errorMessage = 'Invalid order ID';
    }
  }

  loadOrder(): void {
    this.isLoading = true;
    this.sellerOrderService.getSellerOrderById(this.orderId).subscribe({
      next: (res) => {
        if (res.status) {
          this.order = res.data;
        } else {
          this.errorMessage = 'Order not found';
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching order:', err);
        this.errorMessage = 'Failed to load order details';
        this.isLoading = false;
      },
    });
  }

  // Helper to check if the shipping address is an object
  isAddressObject(addr: any): addr is Address {
    return addr && typeof addr === 'object' && 'address' in addr;
  }
}
