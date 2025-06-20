import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
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
  imagePreview: string | null = null;

  private uploadUrl = `${environment.apiUrl}/upload-media`;

  constructor(
    private fb: FormBuilder,
    private sellerService: SellerService,
    private router: Router,
    private http: HttpClient
  ) {
    this.sellerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      gender: ['prefer_not_to_say'],
      mobile: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(10)]],
      email: [''],
      otp: ['0000', Validators.required],
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
      logo: ['', Validators.required],
      status: ['active', Validators.required]
    });
  }

  ngOnInit(): void {}

  onLogoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('type', 'seller');
    formData.append('file', file);

    this.isUploading = true;
    this.uploadError = null;

    this.http.post<{ file: string }>(this.uploadUrl, formData).subscribe({
      next: (res) => {
        const normalizedUrl = res.file.replace(/\\/g, '/');
        this.sellerForm.patchValue({ logo: normalizedUrl });
        this.imagePreview = normalizedUrl;
        this.isUploading = false;
      },
      error: (err) => {
        console.error('Logo upload failed', err);
        this.uploadError = 'Logo upload failed';
        this.isUploading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.sellerForm.invalid || this.isSubmitting) return;

    Swal.fire({
      title: 'Submit Seller?',
      text: 'Are you sure you want to create this seller?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, create',
      cancelButtonText: 'Cancel'
    }).then(result => {
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
          }
        });
      }
    });
  }
}
