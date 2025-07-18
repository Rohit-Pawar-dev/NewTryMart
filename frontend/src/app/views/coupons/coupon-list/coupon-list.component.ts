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

  // Pagination variables
  limit = 10;
  offset = 0;
  total = 0;

  constructor(private couponService: CouponService, private router: Router) { }

  ngOnInit() {
    this.loadCoupons();
  }

  loadCoupons() {
    this.isLoading = true;
    this.couponService.getCoupons({
      search: this.searchTerm,
      limit: this.limit,
      offset: this.offset,
    }).subscribe({
      next: (coupons) => {
        // Since your service currently only returns coupons array,
        // you need total count, totalPages, offset from API response.
        // So we need to update the service method to return the full response.
        // But since you said not to change service, here's a workaround:
        // (Assuming you updated your service to return full response instead of just data)

        // If your service only returns coupons, we cannot get total, so pagination won't work properly.
        // You need to adjust your service to return the full response object, not just data.

        // But I'll write it assuming you return full response here:
        // To work around, change service's return type to Observable<{ data: Coupon[], total: number, limit: number, offset: number }>

        // Let's cast for now:
        const response: any = coupons;
        this.coupons = response.data ?? coupons; // fallback if only coupons returned
        this.total = response.total ?? 0;
        this.limit = response.limit ?? this.limit;
        this.offset = response.offset ?? this.offset;

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
    this.offset = 0; // reset to first page on new search
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

  // Pagination controls
  get currentPage(): number {
    return Math.floor(this.offset / this.limit) + 1;
  }

  get totalPages(): number {
    return Math.ceil(this.total / this.limit);
  }

  nextPage() {
    if (this.offset + this.limit < this.total) {
      this.offset += this.limit;
      this.loadCoupons();
    }
  }

  prevPage() {
    if (this.offset - this.limit >= 0) {
      this.offset -= this.limit;
      this.loadCoupons();
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.offset = (page - 1) * this.limit;
      this.loadCoupons();
    }
  }
}
