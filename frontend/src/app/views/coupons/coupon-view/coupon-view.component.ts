import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CouponService, Coupon } from '../../../services/coupon.service';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-coupon-view',
  templateUrl: './coupon-view.component.html',
  imports: [CommonModule],
})
export class CouponViewComponent implements OnInit {
  coupon: Coupon | null = null;
  isLoading: boolean = true;
  error: string | null = null;

  constructor(private route: ActivatedRoute, private couponService: CouponService) {}

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];

    this.couponService.getCoupon(id).subscribe({
      next: (data) => {
        this.coupon = data;
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Failed to load coupon.';
        this.isLoading = false;
      }
    });
  }
}
