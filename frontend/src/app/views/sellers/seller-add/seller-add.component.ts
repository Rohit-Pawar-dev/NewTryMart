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

  private profileUploadUrl = `${environment.apiUrl}/sellers/upload/profile`;
  private logoUploadUrl = `${environment.apiUrl}/sellers/upload/logo`;

  private bussinessCategoriesUrl = `${environment.apiUrl}/business-categories`
  bussinessCategories: any[] = [];

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
      logo: [''],
      profile_image: [''],
      status: ['active', Validators.required],
      business_category: ['', Validators.required],
    });
  }

  ngOnInit(): void {

    this.loadBusinessCategories();
  }




  loadBusinessCategories(): void {
    this.http.get<{ data: any[] }>(`${this.bussinessCategoriesUrl}?status=active`).subscribe({
      next: (res) => {
        this.bussinessCategories = res.data;
      },
      error: (err) => {
        console.error('Failed to load business categories', err);
      },
    });
  }


  // Handle Logo Selection (only preview)
  onLogoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.selectedLogoFile = file;
    this.uploadError = null;

    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  // Handle Profile Image Selection (only preview)
  onProfileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.selectedProfileFile = file;
    this.uploadError = null;

    const reader = new FileReader();
    reader.onload = () => {
      this.profilePreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }


  async onSubmit(): Promise<void> {
    if (this.sellerForm.invalid || this.isSubmitting) return;

    const confirm = await Swal.fire({
      title: 'Submit Seller?',
      text: 'Are you sure you want to create this seller?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, create',
      cancelButtonText: 'Cancel',
    });

    if (!confirm.isConfirmed) return;

    this.isSubmitting = true;

    try {
      // Upload logo if file is selected
      if (this.selectedLogoFile) {
        const logoForm = new FormData();
        logoForm.append('logo', this.selectedLogoFile);
        const logoRes = await this.http.post<{ path: string }>(this.logoUploadUrl, logoForm).toPromise();
        if (logoRes?.path) {
          this.sellerForm.patchValue({ logo: logoRes.path.replace(/\\/g, '/') });
        }
      }

      // Upload profile image if file is selected
      if (this.selectedProfileFile) {
        const profileForm = new FormData();
        profileForm.append('profile_image', this.selectedProfileFile);
        const profileRes = await this.http.post<{ path: string }>(this.profileUploadUrl, profileForm).toPromise();
        if (profileRes?.path) {
          this.sellerForm.patchValue({ profile_image: profileRes.path.replace(/\\/g, '/') });
        }
      }

      // Submit seller data
      const newSeller = this.sellerForm.value;

      this.sellerService.createSeller(newSeller).subscribe({
        next: () => {
          Swal.fire('Created!', 'Seller has been created.', 'success');
          this.router.navigate(['/admin/sellers']);
        },
        error: (err) => {
          console.error('Error creating seller:', err);
          Swal.fire('Error', 'Failed to create seller.', 'error');
          this.isSubmitting = false;
        },
      });

    } catch (error) {
      console.error('Image upload failed:', error);
      Swal.fire('Error', 'Image upload failed', 'error');
      this.isSubmitting = false;
    }
  }

}
