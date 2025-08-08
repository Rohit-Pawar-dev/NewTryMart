import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SellerAuthService } from '../../../services/sellerAuth.service';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-seller-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './login.component.html',
})
export class SellerLoginComponent {
  private fb = inject(FormBuilder);
  private sellerAuthService = inject(SellerAuthService);
  private router = inject(Router);

  // FormGroup for OTP login
  otpLoginForm = this.fb.group({
    mobile: [
      '',
      [Validators.required, Validators.pattern('^[0-9]{10}$'), Validators.maxLength(10)],
    ],
    otp: [
      { value: '', disabled: true },
      [Validators.required, Validators.pattern('^[0-9]{4}$'), Validators.maxLength(4)],
    ],
  });

  // FormGroup for Email/Password login
  emailPasswordLoginForm = this.fb.group({
    email: [
      '',
      [Validators.required, Validators.email],
    ],
    password: [
      '',
      [Validators.required, Validators.minLength(6)],
    ],
  });

  loading = false;
  otpSent = false;
  isOtpLogin = true;  // Switch between OTP login and Email/Password login

  // Submit handler for OTP Login
  onSubmitOtpLogin() {
    if (this.otpLoginForm.controls.mobile.invalid) {
      Swal.fire('Error', 'Please enter a valid 10-digit mobile number.', 'error');
      return;
    }

    this.loading = true;
    const mobile = this.otpLoginForm.value.mobile!;

    this.sellerAuthService.otploginSeller(mobile).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.otpSent = true;
        this.otpLoginForm.controls.otp.enable();
        Swal.fire('OTP Sent', 'OTP has been sent to your mobile number.', 'success');
        console.log('OTP (for testing):', res.otp);
      },
      error: (err) => {
        this.loading = false;
        Swal.fire('Error', err?.error?.message || 'Login failed.', 'error');
      },
    });
  }

  // Submit handler for OTP Verification
  onVerifyOtp() {
    if (this.otpLoginForm.controls.otp.invalid) {
      Swal.fire('Error', 'Please enter a valid 4-digit OTP.', 'error');
      return;
    }

    const { mobile, otp } = this.otpLoginForm.value;

    this.loading = true;
    this.sellerAuthService.verifyOtp(mobile!, otp!).subscribe({
      next: (res: any) => {
        this.loading = false;
        Swal.fire('Success', res.message || 'OTP verified. Login successful!', 'success');
        this.otpLoginForm.reset();
        this.otpLoginForm.controls.otp.disable();
        this.otpSent = false;
        localStorage.setItem('seller_token', res.token);
        localStorage.setItem('seller_profile', JSON.stringify(res.seller));
        this.router.navigate(['/seller']);
      },
      error: (err : any) => {
        this.loading = false;
        Swal.fire('Error', err?.error?.message || 'OTP verification failed.', 'error');
      },
    });
  }

  // Resend OTP functionality
  onResendOtp() {
    if (this.otpLoginForm.controls.mobile.invalid) {
      Swal.fire('Error', 'Please enter a valid 10-digit mobile number before resending OTP.', 'error');
      return;
    }
    this.onSubmitOtpLogin();
  }

  // Switch to Email/Password Login
  onSubmitEmailPasswordLogin() {
    if (this.emailPasswordLoginForm.invalid) {
      Swal.fire('Error', 'Please enter a valid email and password.', 'error');
      return;
    }

    this.loading = true;
    const { email, password } = this.emailPasswordLoginForm.value;

    this.sellerAuthService.emailPasswordLogin(email!, password!).subscribe({
      next: (res: any) => {
        this.loading = false;
        Swal.fire('Success', res.message || 'Login successful!', 'success');
        localStorage.setItem('seller_token', res.token);
        localStorage.setItem('seller_profile', JSON.stringify(res.seller));
        this.router.navigate(['/seller']);
      },
      error: (err : any) => {
        this.loading = false;
        Swal.fire('Error', err?.error?.message || 'Login failed.', 'error');
      },
    });
  }

  // Toggle between OTP login and Email/Password login
  toggleLoginMode(isOtp: boolean) {
    this.isOtpLogin = isOtp;
    this.otpLoginForm.reset();
    this.emailPasswordLoginForm.reset();
    this.otpSent = false;
  }

  navigateToRegister() {
    this.router.navigate(['/seller/register']);
  }
}
