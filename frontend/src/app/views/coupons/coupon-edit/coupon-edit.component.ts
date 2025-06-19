import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CouponService } from '../../../../app/services/coupon.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  standalone: true,
  selector: 'app-coupon-edit',
  templateUrl: './coupon-edit.component.html',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
})
export class CouponEditComponent implements OnInit {
  form: FormGroup;
  id = '';
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private couponService: CouponService,
    private router: Router
  ) {
    this.form = this.fb.group({
      couponTitle: ['', Validators.required],
      couponCode: ['', Validators.required],
      discountType: ['percentage', Validators.required],
      discountAmount: [0, [Validators.required, Validators.min(0)]],
      minimumPurchase: [0, [Validators.required, Validators.min(0)]],
      startDate: ['', Validators.required],
      expireDate: ['', Validators.required],
      status: ['active', Validators.required],
    });
  }

  ngOnInit(): void {
    this.id = this.route.snapshot.params['id'];
    this.couponService.getCoupon(this.id).subscribe(res => {
      const c = (res as any).data || res;
      this.form.patchValue({
        couponTitle: c.couponTitle,
        couponCode: c.couponCode,
        discountType: c.discountType,
        discountAmount: c.discountAmount,
        minimumPurchase: c.minimumPurchase,
        startDate: this.formatDate(c.startDate),
        expireDate: this.formatDate(c.expireDate),
        status: c.status,
      });
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

    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to update this coupon?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, update it!',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        this.isSubmitting = true;

        this.couponService.updateCoupon(this.id, this.form.value).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Coupon Updated',
              text: 'The coupon has been successfully updated!',
              confirmButtonText: 'OK',
            }).then(() => {
              this.router.navigate(['/coupons']);
            });
          },
          error: () => {
            this.isSubmitting = false;
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Something went wrong while updating the coupon.',
              confirmButtonText: 'Try Again',
            });
          },
        });
      }
    });
  }

  private formatDate(date: string): string {
    return new Date(date).toISOString().split('T')[0];
  }
}
