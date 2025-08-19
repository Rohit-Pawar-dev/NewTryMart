import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SellerOrderService, Order, Address, OrderStatus } from '../../../services/seller-order.service';
import Swal from 'sweetalert2';
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

  constructor(
    private route: ActivatedRoute,
    private sellerOrderService: SellerOrderService
  ) { }

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
  updateOrderStatus(newStatus: string): void {
    if (!this.order || !this.orderId) return;

    const oldStatus: OrderStatus = this.order.status;

    // cast newStatus into OrderStatus
    this.order.status = newStatus as OrderStatus;

    this.sellerOrderService
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
  
    updatePaymentStatus(): void {
      if (!this.order || !this.orderId) return;
  
      this.sellerOrderService
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
}
