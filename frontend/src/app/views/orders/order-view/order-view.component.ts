import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { OrderService, Order } from '../../../services/order.service';


@Component({
  selector: 'app-order-view',
  standalone: true,
  imports: [CommonModule, RouterModule],
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
    console.log('Route param ID:', this.orderId);

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

}
