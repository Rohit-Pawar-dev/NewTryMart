import { Component, OnInit } from '@angular/core';
import { CouponService, Coupon } from '../../../services/coupon.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-coupon-list',
  templateUrl: './coupon-list.component.html',
  imports: [CommonModule, RouterModule, FormsModule],
})
export class CouponListComponent implements OnInit {
  coupons: Coupon[] = [];
  searchTerm = '';
  isLoading = false;

  constructor(private couponService: CouponService, private router: Router) {}

  ngOnInit() {
    this.loadCoupons();
  }

  loadCoupons() {
    this.isLoading = true;
    this.couponService.getCoupons({ search: this.searchTerm }).subscribe({
      next: (coupons) => {
        this.coupons = coupons;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading coupons:', err);
        this.isLoading = false;
      }
    });
  }

  onSearchChange() {
    this.loadCoupons();
  }

  deleteCoupon(id: string) {
    if (confirm('Are you sure to delete?')) {
      this.couponService.deleteCoupon(id).subscribe(() => this.loadCoupons());
    }
  }

  toggleStatus(coupon: Coupon) {
    const newStatus = coupon.status === 'active' ? 'inactive' : 'active';
    this.couponService.updateCoupon(coupon._id!, { status: newStatus }).subscribe(() => this.loadCoupons());
  }
}
