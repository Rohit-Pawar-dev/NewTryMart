import { Component, OnInit } from '@angular/core';
import { CouponService, Coupon } from '../../../services/coupon.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

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
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load coupons.',
        });
      },
    });
  }

  onSearchChange() {
    this.loadCoupons();
  }

  deleteCoupon(id: string) {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This will permanently delete the coupon.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        this.couponService.deleteCoupon(id).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: 'The coupon has been deleted.',
            });
            this.loadCoupons();
          },
          error: () => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Failed to delete the coupon.',
            });
          },
        });
      }
    });
  }

  toggleStatus(coupon: Coupon) {
    const newStatus = coupon.status === 'active' ? 'inactive' : 'active';

    this.couponService.updateCoupon(coupon._id!, { status: newStatus }).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: `Coupon status has been changed to ${newStatus}.`,
        });
        this.loadCoupons();
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to update status.',
        });
      },
    });
  }
}
