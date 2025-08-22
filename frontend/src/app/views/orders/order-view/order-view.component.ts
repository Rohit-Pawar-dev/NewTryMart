import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { OrderService, Order, OrderStatus } from '../../../services/order.service';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { environment } from '../../../../environments/environment';

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
  previousStatus: string = '';
 mediaUrl = environment.mediaUrl;
  constructor(
    private route: ActivatedRoute,
    private orderService: OrderService
  ) { }

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
  isAddressObject(addr: any): addr is Address {
    return addr && typeof addr === 'object' && 'address' in addr;
  }


  updatePaymentStatus(): void {
    if (!this.order || !this.orderId) return;

    this.orderService
      .changePaymentStatus(this.orderId, this.order.payment_status)
      .subscribe({
        next: (res) => {
          if (res.status) {
            Swal.fire({
              icon: 'success',
              title: res.message,
              timer: 1500,
              showConfirmButton: false,
            });
          }
        },
        error: (err) => {
          console.error('Error updating payment status:', err);
          Swal.fire({
            icon: 'error',
            title: 'Failed to update payment status',
            text: err?.error?.message || 'Server error',
          });
        },
      });
  }



  updateOrderStatus(newStatus: string): void {
    if (!this.order || !this.orderId) return;

    const oldStatus: OrderStatus = this.order.status;

    // cast newStatus into OrderStatus
    this.order.status = newStatus as OrderStatus;

    this.orderService
      .changeOrderStatus(this.orderId, newStatus as OrderStatus)
      .subscribe({
        next: (res) => {
          if (res.status) {
            Swal.fire({
              icon: 'success',
              title: res.message,
              timer: 1500,
              showConfirmButton: false,
            });
          } else if (this.order) {
            this.order.status = oldStatus;
          }
        },
        error: (err) => {
          console.error('Error updating order status:', err);

          let errorMessage = err?.error?.message || 'Server error';

          if (this.order) {
            this.order.status = oldStatus;
          }

          Swal.fire({
            icon: 'error',
            title: errorMessage.includes('Paid')
              ? 'Unpaid Order'
              : errorMessage.includes('Delivered')
                ? 'Delivered orders cannot be changed'
                : 'Failed to update order status',
            text: errorMessage,
          });
        },
      });
  }




}

interface Address {
  name: string;
  // phone?: string;   
  mobile: string;
  city: string;
  pincode: string;
  address: string;
}
