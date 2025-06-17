import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CouponService } from '../../../../app/services/coupon.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-coupon-add',
  templateUrl: './coupon-add.component.html',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
})
export class CouponAddComponent {
  form: FormGroup;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private couponService: CouponService,
    private router: Router
  ) {
    this.form = this.fb.group({
      couponTitle: ['', Validators.required],
      couponCode: ['', Validators.required],
      discountType: ['percentage', Validators.required],
      // allow 0 for both percentage and flat
      discountAmount: [0, [Validators.required, Validators.min(0)]],
      minimumPurchase: [0, [Validators.required, Validators.min(0)]],
      startDate: ['', Validators.required],
      expireDate: ['', Validators.required],
      status: ['active', Validators.required],
    });
  }

  generateCode(): void {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 10; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.form.get('couponCode')!.setValue(code);
  }

  submit(): void {
    if (this.form.invalid || this.isSubmitting) return;
    this.isSubmitting = true;
    this.couponService.createCoupon(this.form.value).subscribe({
      next: () => this.router.navigate(['/coupons']),
      error: () => {
        this.isSubmitting = false;
      },
    });
  }
}
