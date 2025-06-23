import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { SellerService } from '../../../services/seller.service';
import { environment } from '../../../../environments/environment';

import Swal from 'sweetalert2';

@Component({
  standalone: true,
  selector: 'app-seller-add',
  templateUrl: './seller-add.component.html',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
})
export class SellerAddComponent implements OnInit {
  sellerForm: FormGroup;
  isSubmitting = false;
  isUploading = false;
  uploadError: string | null = null;

  imagePreview: string | null = null; // logo preview
  profilePreview: string | null = null; // profile preview

  selectedLogoFile: File | null = null;
  selectedProfileFile: File | null = null;

  private uploadUrl = `${environment.apiUrl}/upload-media`;

  constructor(
    private fb: FormBuilder,
    private sellerService: SellerService,
    private router: Router,
    private http: HttpClient
  ) {
    this.sellerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      gender: ['male'],
      mobile: [
        '',
        [
          Validators.required,
          Validators.minLength(10),
          Validators.maxLength(10),
        ],
      ],
      email: [''],
      shop_name: ['', Validators.required],
      address: [''],
      country: [''],
      state: [''],
      city: [''],
      pincode: [''],
      // business_category: ['', Validators.required],
      gst_number: [''],
      // gst_registration_type: ['Unregistered'],
      gst_verified: [false],
      logo: ['', Validators.required],
      profile_image: ['', Validators.required],
      status: ['active', Validators.required],
    });
  }

  ngOnInit(): void {}

  // Handle Logo Upload
  onLogoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.selectedLogoFile = file;
    this.uploadError = null;
    this.isUploading = true;

    const formData = new FormData();
    formData.append('type', 'seller-logo');
    formData.append('file', file);

    this.http.post<{ file: string }>(this.uploadUrl, formData).subscribe({
      next: (res) => {
        const url = res.file.replace(/\\/g, '/');
        this.sellerForm.patchValue({ logo: url });
        this.imagePreview = url;
        this.isUploading = false;
      },
      error: (err) => {
        console.error('Logo upload failed', err);
        this.uploadError = 'Logo upload failed';
        this.isUploading = false;
      },
    });
  }

  // Handle Profile Image Upload
  onProfileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.selectedProfileFile = file;
    this.uploadError = null;
    this.isUploading = true;

    const formData = new FormData();
    formData.append('type', 'seller-profile');
    formData.append('file', file);

    const reader = new FileReader();
    reader.onload = () => {
      this.profilePreview = reader.result as string;
    };
    reader.readAsDataURL(file);

    this.http.post<{ file: string }>(this.uploadUrl, formData).subscribe({
      next: (res) => {
        const url = res.file.replace(/\\/g, '/');
        this.sellerForm.patchValue({ profile_image: url });
        this.isUploading = false;
      },
      error: (err) => {
        console.error('Profile image upload failed', err);
        this.uploadError = 'Profile image upload failed';
        this.isUploading = false;
      },
    });
  }

  // Submit Seller Form
  onSubmit(): void {
    if (this.sellerForm.invalid || this.isSubmitting) return;

    Swal.fire({
      title: 'Submit Seller?',
      text: 'Are you sure you want to create this seller?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, create',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        this.isSubmitting = true;
        const newSeller = this.sellerForm.value;

        this.sellerService.createSeller(newSeller).subscribe({
          next: () => {
            Swal.fire('Created!', 'Seller has been created.', 'success');
            this.router.navigate(['/sellers']);
          },
          error: (err) => {
            console.error('Error creating seller:', err);
            Swal.fire('Error', 'Failed to create seller.', 'error');
            this.isSubmitting = false;
          },
        });
      }
    });
  }
}
