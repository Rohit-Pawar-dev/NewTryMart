import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { SellerService, Seller } from '../../../services/seller.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

import Swal from 'sweetalert2';

@Component({
  standalone: true,
  selector: 'app-seller-edit',
  templateUrl: './seller-edit.component.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
  ]
})
export class SellerEditComponent implements OnInit {
  sellerForm: FormGroup;
  isSubmitting = false;
  isUploading = false;
  uploadError: string | null = null;
  imagePreview: string | null = null;
  sellerId: string | null = null;

  private uploadUrl = `${environment.apiUrl}/upload-media`;

  constructor(
    private fb: FormBuilder,
    private sellerService: SellerService,
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient
  ) {
    this.sellerForm = this.fb.group({
      name: ['', Validators.required],
      gender: ['prefer_not_to_say'],
      mobile: ['', [Validators.required, Validators.maxLength(10)]],
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
      status: ['active', Validators.required],
    });
  }

  ngOnInit(): void {
    this.sellerId = this.route.snapshot.paramMap.get('id');
    if (this.sellerId) {
      this.sellerService.getSeller(this.sellerId).subscribe({
        next: (seller: Seller) => {
          this.sellerForm.patchValue(seller);
          if (seller.logo) {
            this.imagePreview = seller.logo;
          }
        },
        error: (err) => console.error('Error loading seller:', err)
      });
    }
  }

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
    if (this.sellerForm.invalid || !this.sellerId) return;

    Swal.fire({
      title: 'Update Seller?',
      text: 'Are you sure you want to update this seller?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, update',
      cancelButtonText: 'Cancel'
    }).then(result => {
      if (result.isConfirmed) {
        this.isSubmitting = true;
        const updatedSeller = this.sellerForm.value;

        this.sellerService.updateSeller(this.sellerId!, updatedSeller).subscribe({
          next: () => {
            Swal.fire('Updated!', 'Seller has been updated.', 'success');
            this.router.navigate(['/sellers']);
          },
          error: (err) => {
            console.error('Error updating seller:', err);
            Swal.fire('Error', 'Failed to update seller.', 'error');
            this.isSubmitting = false;
          }
        });
      }
    });
  }
}
