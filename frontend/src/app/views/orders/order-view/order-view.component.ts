import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { OrderService, Order } from '../../../services/order.service';
import { FormsModule } from '@angular/forms';

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
    private orderService: OrderService
  ) {}

  ngOnInit(): void {
    this.orderId = this.route.snapshot.paramMap.get('id') || '';
    if (this.orderId) {
      this.loadOrder();
    }
  }

  loadOrder(): void {
    this.isLoading = true;
    this.orderService.getOrderById(this.orderId).subscribe({
      next: (res) => {
        this.order = res.data;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load order details';
        this.isLoading = false;
      },
    });
  }

  // ✅ Helper to check if the shipping address is an object
  isAddressObject(addr: any): addr is Address {
    return addr && typeof addr === 'object' && 'address' in addr;
  }
}

// ✅ Address type interface
interface Address {
  name: string;
  phone: string;
  city: string;
  pincode: string;
  address: string;
}
