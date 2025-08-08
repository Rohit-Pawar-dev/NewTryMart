import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SellerAuthService } from '../../../services/sellerAuth.service';  
import Swal from 'sweetalert2';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  submitting = false;
  businessCategories: Array<{ _id: string, name: string }> = [];

  constructor(
    private fb: FormBuilder,
    private sellerAuthService: SellerAuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      gender: ['male', Validators.required],
      mobile: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      email: ['', [Validators.email]],
      shop_name: ['', Validators.required],
      address: [''],
      country: [''],
      state: [''],
      city: [''],
      pincode: [''],
      business_category: ['', Validators.required],
      gst_number: [''],
      gst_registration_type: ['Unregistered'],
      gst_verified: [false],
      password: [''], 
      logo: [''],  
      profile_image: [''],
    });
  }

  ngOnInit() {
    this.loadBusinessCategories();
  }

  loadBusinessCategories() {
    this.sellerAuthService.getBusinessCategories().subscribe({
      next: (res) => {
        if (res.status && res.data) {
          this.businessCategories = res.data;
        } else {
          Swal.fire('Error', 'Failed to load business categories', 'error');
        }
      },
      error: () => {
        Swal.fire('Error', 'Failed to load business categories', 'error');
      }
    });
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid input',
        text: 'Please fill all required fields correctly.'
      });
      return;
    }

    this.submitting = true;
    const formData = this.registerForm.value;

    this.sellerAuthService.registerSeller(formData).subscribe({
      next: (response) => {
        this.submitting = false;
        Swal.fire({
          icon: 'success',
          title: 'Registration Successful',
          text: response.message || 'Seller registered successfully. Please wait for admin approval.'
        }).then(() => {
          this.router.navigate(['/login']);
        });
      },
      error: (error) => {
        this.submitting = false;
        Swal.fire({
          icon: 'error',
          title: 'Registration Failed',
          text: error.error?.message || 'Failed to register seller. Please try again.'
        });
      }
    });
  }
}
