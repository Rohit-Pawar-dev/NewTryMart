import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { SellerService, Seller } from '../../../services/seller.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import Swal from 'sweetalert2';

@Component({
  standalone: true,
  selector: 'app-seller-edit',
  templateUrl: './seller-edit.component.html',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
})
export class SellerEditComponent implements OnInit {
  sellerForm: FormGroup;
  isSubmitting = false;
  isUploading = false;
  uploadError: string | null = null;

  imagePreview: string | null = null;
  profilePreview: string | null = null;

  selectedLogoFile: File | null = null;
  selectedProfileFile: File | null = null;

  sellerId: string | null = null;
  mediaUrl = environment.mediaUrl;

  private logoUploadUrl = `${environment.apiUrl}/sellers/upload/logo`;
  private profileUploadUrl = `${environment.apiUrl}/sellers/upload/profile`;
  private bussinessCategoriesUrl = `${environment.apiUrl}/business-categories`
  bussinessCategories: any[] = [];




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
      shop_name: ['', Validators.required],
      address: [''],
      country: [''],
      state: [''],
      city: [''],
      pincode: [''],
      business_category: ['', Validators.required],
      gst_number: [''],
      // gst_registration_type: ['Unregistered'],
      gst_verified: [false],
      logo: ['', Validators.required],
      profile_image: [''],
      status: ['active', Validators.required],
    });
  }

  ngOnInit(): void {

    this.loadBusinessCategories();
    this.sellerId = this.route.snapshot.paramMap.get('id');
    if (this.sellerId) {
      this.sellerService.getSeller(this.sellerId).subscribe({
        next: (seller: Seller) => {
          // Patch form values with fetched seller data
          this.sellerForm.patchValue(seller);

          // Set previews for existing images (with media URL prefix if needed)
          if (seller.logo) this.imagePreview = this.mediaUrl + seller.logo;
          if (seller.profile_image) this.profilePreview = this.mediaUrl + seller.profile_image;
        },
        error: (err) => console.error('Error loading seller:', err),
      });
    }
  }

  // On selecting logo, only show preview (do NOT upload)
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

  // On selecting profile image, only show preview (do NOT upload)
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
  // On submit, first upload selected images (if any), then submit the seller update
  async onSubmit(): Promise<void> {
    if (this.sellerForm.invalid || !this.sellerId || this.isSubmitting) return;

    const confirm = await Swal.fire({
      title: 'Update Seller?',
      text: 'Are you sure you want to update this seller?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, update',
      cancelButtonText: 'Cancel',
    });

    if (!confirm.isConfirmed) return;

    this.isSubmitting = true;

    try {
      // Upload logo if selected
      if (this.selectedLogoFile) {
        const logoForm = new FormData();
        logoForm.append('logo', this.selectedLogoFile);
        const logoRes = await this.http.post<{ path: string }>(this.logoUploadUrl, logoForm).toPromise();
        if (logoRes?.path) {
          this.sellerForm.patchValue({ logo: logoRes.path.replace(/\\/g, '/') });
        }
      }

      // Upload profile image if selected
      if (this.selectedProfileFile) {
        const profileForm = new FormData();
        profileForm.append('profile_image', this.selectedProfileFile);
        const profileRes = await this.http.post<{ path: string }>(this.profileUploadUrl, profileForm).toPromise();
        if (profileRes?.path) {
          this.sellerForm.patchValue({ profile_image: profileRes.path.replace(/\\/g, '/') });
        }
      }

      // Submit the updated seller
      const updatedSeller = this.sellerForm.value;

      this.sellerService.updateSeller(this.sellerId, updatedSeller).subscribe({
        next: () => {
          Swal.fire('Updated!', 'Seller has been updated.', 'success');
          this.router.navigate(['/sellers']);
        },
        error: (err) => {
          console.error('Error updating seller:', err);
          Swal.fire('Error', 'Failed to update seller.', 'error');
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