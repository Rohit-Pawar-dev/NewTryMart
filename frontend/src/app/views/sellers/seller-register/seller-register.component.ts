import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SellerAuthService } from '../../../services/sellerAuth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-seller-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './seller-register.component.html',
})
export class SellerRegisterComponent {
  registerForm: FormGroup;
  selectedLogoFile: File | null = null;
  submitting = false;

  constructor(
    private fb: FormBuilder,
    private sellerAuthService: SellerAuthService
  ) {
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      gender: ['', Validators.required],
      mobile: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      email: ['', [Validators.required, Validators.email]],
      shop_name: ['', Validators.required],
      address: ['', Validators.required],
      country: ['', Validators.required],
      state: ['', Validators.required],
      city: ['', Validators.required],
      pincode: ['', Validators.required],
      business_category: ['', Validators.required],
      gst_number: ['', Validators.required],
      gst_registration_type: ['', Validators.required],
      gst_verified: [false, Validators.required],
      logo: [null]
    });
  }

  onFileChange(event: any) {
    if (event.target.files.length > 0) {
      this.selectedLogoFile = event.target.files[0];
    }
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      Swal.fire('Error', 'Please fill all required fields correctly!', 'error');
      return;
    }

    this.submitting = true;
    const formData = { ...this.registerForm.value };

    this.sellerAuthService.registerSeller(formData, this.selectedLogoFile!)
      .subscribe({
        next: () => {
          Swal.fire('Success', 'Seller registered successfully!', 'success');
          this.registerForm.reset();
          this.selectedLogoFile = null;
          this.submitting = false;
        },
        error: (err) => {
          Swal.fire('Error', err?.error?.message || 'Registration failed!', 'error');
          this.submitting = false;
        }
      });
  }
}
