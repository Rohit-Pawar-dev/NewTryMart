import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OrderService, Order, Address, OrderItem } from '../../../services/order.service';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {environment} from '../../../../environments/environment';

@Component({
  selector: 'app-order-invoice',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-invoice.component.html',
  styleUrls: ['./order-invoice.component.scss'],
})
export class OrderInvoiceComponent implements OnInit {
  orderId!: string;
  order: Order | null = null;
  isLoading = true;
  errorMessage = '';
  autoDownload = false;
  mediaUrl = environment.mediaUrl;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService
  ) {}

  ngOnInit(): void {
    this.orderId = this.route.snapshot.paramMap.get('id')!;
    this.autoDownload = this.route.snapshot.queryParamMap.get('download') === 'true';

    if (this.orderId) {
      this.fetchOrder();
    } else {
      this.errorMessage = 'No order ID provided.';
      this.isLoading = false;
    }
  }

  fetchOrder(): void {
    this.orderService.getOrderById(this.orderId).subscribe({
      next: (res) => {
        if (res.status) {
          this.order = res.data;
          this.isLoading = false;

          if (this.autoDownload) {
            setTimeout(() => this.exportToPDF(), 500);
          }
        } else {
          this.errorMessage = 'Failed to load order.';
          this.isLoading = false;
        }
      },
      error: (err) => {
        this.errorMessage = 'Error fetching order.';
        console.error(err);
        this.isLoading = false;
      },
    });
  }

  calculateFinalPrice(item: OrderItem): number {
    const discountAmount = item.discount_type === 'flat'
      ? item.discount
      : (item.unit_price * item.discount) / 100;
    return item.unit_price - discountAmount;
  }

  getTotalPayable(): number {
    if (!this.order) return 0;
    return (this.order.total_price ?? 0) + (this.order.shipping_cost ?? 0) - (this.order.coupon_amount ?? 0);
  }

  // Check if value is an Address object
  isAddress(value: Address | string | null): value is Address {
    return value !== null && typeof value === 'object' && 'name' in value;
  }

  exportToPDF(): void {
    const content = document.getElementById('invoice-content');
    if (!content) return;

    html2canvas(content, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`invoice-${this.order?.order_id || 'order'}.pdf`);

      // if (this.autoDownload) {
      //   setTimeout(() => this.router.navigate(['/admin/orders']), 1000);
      // }
    });
  }
}
