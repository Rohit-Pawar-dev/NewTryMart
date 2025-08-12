import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SellerAuthService } from '../../services/sellerAuth.service';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-seller-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './seller-profile.component.html',
})
export class SellerProfileComponent implements OnInit {
  sellerForm!: FormGroup;
  loading: boolean = true;
  isSubmitting = false;
  passwordForm!: FormGroup;
  showOldPassword = false;
showNewPassword = false;
showConfirmPassword = false;


  // Image previews for UI
  profileImagePreview: string | null = null;
  logoPreview: string | null = null;

  // Selected files
  selectedProfileImage: File | null = null;
  selectedLogo: File | null = null;

  // Original paths from DB
  originalProfileImagePath: string | null = null;
  originalLogoPath: string | null = null;

  mediaUrl = environment.mediaUrl;

  private apiUrl = `${environment.apiUrl}/sellers`;
  public uploadLogoUrl = `${this.apiUrl}/upload/logo`;
  private uploadProfileImageUrl = `${this.apiUrl}/upload/profile`;

  constructor(
    private sellerService: SellerAuthService,
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.sellerForm = this.fb.group({
      name: [''],
      gender: [''],
      mobile: [''],
      email: [''],
      shop_name: [''],
      address: [''],
      country: [''],
      state: [''],
      city: [''],
      pincode: [''],
      business_category: [''],
      gst_number: [''],
      gst_registration_type: [''],
      gst_verified: [''],
      status: [''],


    });
    this.passwordForm = this.fb.group({
      oldPassword: [''],
      newPassword: [''],
      confirmPassword: [''],
    });

    this.loadProfile();
  }

  loadProfile(): void {
    this.sellerService.getSellerProfile().subscribe((res) => {
      if (res.status) {
        this.sellerForm.patchValue(res.data);

        // Store original DB values
        this.originalProfileImagePath = res.data.profile_image || null;
        this.originalLogoPath = res.data.logo || null;

        // Set preview URLs
        this.profileImagePreview = this.originalProfileImagePath
          ? `${this.mediaUrl}${this.originalProfileImagePath}`
          : null;

        this.logoPreview = this.originalLogoPath
          ? `${this.mediaUrl}${this.originalLogoPath}`
          : null;
      }
      this.loading = false;
    });
  }

  onProfileImageSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedProfileImage = file;

      const reader = new FileReader();
      reader.onload = () => {
        this.profileImagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onLogoSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedLogo = file;

      const reader = new FileReader();
      reader.onload = () => {
        this.logoPreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  async saveProfile(): Promise<void> {
    if (this.sellerForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;

      try {
        let profileImagePath = this.originalProfileImagePath;
        let logoPath = this.originalLogoPath;
        if (this.selectedProfileImage) {
          const profileFormData = new FormData();
          profileFormData.append('profile_image', this.selectedProfileImage);

          const profileUploadRes: any = await this.http
            .post(this.uploadProfileImageUrl, profileFormData)
            .toPromise();
          profileImagePath = profileUploadRes.path;
        }

        // Upload logo if selected
        if (this.selectedLogo) {
          const logoFormData = new FormData();
          logoFormData.append('logo', this.selectedLogo);

          const logoUploadRes: any = await this.http
            .post(this.uploadLogoUrl, logoFormData)
            .toPromise();
          logoPath = logoUploadRes.path;
        }

        // Prepare final data
        const editableData = {
          name: this.sellerForm.value.name,
          gender: this.sellerForm.value.gender,
          mobile: this.sellerForm.value.mobile,
          email: this.sellerForm.value.email,
          shop_name: this.sellerForm.value.shop_name,
          address: this.sellerForm.value.address,
          country: this.sellerForm.value.country,
          state: this.sellerForm.value.state,
          city: this.sellerForm.value.city,
          pincode: this.sellerForm.value.pincode,
          gst_number: this.sellerForm.value.gst_number,
          profile_image: profileImagePath,
          logo: logoPath,
        };

        this.sellerService.updateSellerProfile(editableData).subscribe({
          next: (res) => {
            if (res.status) {
              Swal.fire({
                icon: 'success',
                title: 'Profile Updated',
                text: 'Your profile has been updated successfully.',
                confirmButtonText: 'OK',
              }).then(() => {
                this.router.navigate(['/seller/profile']);
              });
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Update Failed',
                text: 'There was an error updating your profile.',
              });
            }
          },
          error: () => {
            Swal.fire({
              icon: 'error',
              title: 'Server Error',
              text: 'Please try again later.',
            });
          },
          complete: () => {
            this.isSubmitting = false;
          },
        });
      } catch (error) {
        console.error(error);
        Swal.fire({
          icon: 'error',
          title: 'Upload Failed',
          text: 'Failed to upload image or logo.',
        });
        this.isSubmitting = false;
      }
    }
  }
  logout(): void {
    localStorage.removeItem('seller_token');
    localStorage.removeItem('seller_profile');
    this.router.navigate(['/seller/login']);
  }

  changePassword(): void {
    const { oldPassword, newPassword, confirmPassword } = this.passwordForm.value;

    if (!this.passwordForm.valid) {
      Swal.fire('Error', 'Please fill all password fields correctly.', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      Swal.fire('Error', 'New passwords do not match.', 'error');
      return;
    }

    this.sellerService.changePassword(oldPassword, newPassword).subscribe({
      next: (res) => {
        if (res.status) {
          Swal.fire({
            icon: 'success',
            title: 'Password Changed',
            text: 'Your password has been updated successfully. Please log in again.',
            confirmButtonText: 'OK'
          }).then(() => {
            this.logout(); 
          });
        } else {
          Swal.fire('Error', res.message || 'Password change failed.', 'error');
        }
      },
      error: (err) => {
        Swal.fire('Error', err?.error?.message || 'An error occurred.', 'error');
      }
    });
  }

}