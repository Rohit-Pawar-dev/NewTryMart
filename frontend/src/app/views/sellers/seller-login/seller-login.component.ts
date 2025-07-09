import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SellerAuthService } from '../../../services/sellerAuth.service';
import { HttpClientModule } from '@angular/common/http';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-seller-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './seller-login.component.html',
})
export class SellerLoginComponent {
  private fb = inject(FormBuilder);
  private sellerAuthService = inject(SellerAuthService);

  loginForm = this.fb.group({
    mobile: ['', [Validators.required, Validators.pattern('^[0-9]{10}$'), Validators.maxLength(10)]],
    otp: ['', [Validators.required, Validators.pattern('^[0-9]{4}$'), Validators.maxLength(4)]]
  });

  loading = false;
  otpSent = false;

  onSubmit() {
    if (this.loginForm.controls.mobile.invalid) {
      Swal.fire('Error', 'Please enter a valid 10-digit mobile number.', 'error');
      return;
    }

    this.loading = true;
    const mobile = this.loginForm.value.mobile!;

    this.sellerAuthService.loginSeller(mobile).subscribe({
      next: (res) => {
        this.loading = false;
        this.otpSent = true; // ✅ Hides Send OTP button and shows OTP section
        Swal.fire('OTP Sent', 'OTP has been sent to your mobile number.', 'success');
        console.log('OTP (for testing):', res.otp); // Remove in production
      },
      error: (err) => {
        this.loading = false;
        Swal.fire('Error', err?.error?.message || 'Login failed.', 'error');
      }
    });
  }

  onVerifyOtp() {
    if (this.loginForm.controls.otp.invalid) {
      Swal.fire('Error', 'Please enter a valid 4-digit OTP.', 'error');
      return;
    }

    const { mobile, otp } = this.loginForm.value;

    this.loading = true;
    this.sellerAuthService.verifyOtp(mobile!, otp!).subscribe({
      next: (res) => {
        this.loading = false;
        Swal.fire('Success', res.message || 'OTP verified. Login successful!', 'success');
        this.loginForm.reset();
        this.otpSent = false; // ✅ Reset OTP UI
      },
      error: (err) => {
        this.loading = false;
        Swal.fire('Error', err?.error?.message || 'OTP verification failed.', 'error');
      }
    });
  }

  onResendOtp() {
    this.onSubmit(); // Just calls login again
  }
}
