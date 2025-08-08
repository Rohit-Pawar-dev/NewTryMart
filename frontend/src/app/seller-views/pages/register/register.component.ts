import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';

import { environment } from '../../../../environments/environment';

@Component({
  standalone: true,
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  imports: [CommonModule, ReactiveFormsModule],
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  isSubmitting = false;

  imagePreview: string | null = null; // logo preview
  profilePreview: string | null = null; // profile preview

  selectedLogoFile: File | null = null;
  selectedProfileFile: File | null = null;

  businessCategories: any[] = [];

  private businessCategoriesUrl = `${environment.apiUrl}/business-categories`;
  private profileUploadUrl = `${environment.apiUrl}/sellers/upload/profile`;
  private logoUploadUrl = `${environment.apiUrl}/sellers/upload/logo`;
  private registerSellerUrl = `${environment.apiUrl}/sellers/register`;

  constructor(private fb: FormBuilder, private http: HttpClient, private router: Router) {
    // Set disabled state during FormControl creation (recommended way)
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      gender: ['male'],
      mobile: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(10)]],
      email: ['', [Validators.required, Validators.email]],
      shop_name: ['', Validators.required],
      address: [''],
      country: [''],
      state: [''],
      city: [''],
      pincode: [''],
      gst_number: [''],
      gst_verified: [{ value: false, disabled: true }],
      logo: [''],
      profile_image: [''],
      status: ['active'],
      business_category: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadBusinessCategories();
  }

  loadBusinessCategories(): void {
    this.http.get<{ data: any[] }>(`${this.businessCategoriesUrl}?status=active`).subscribe({
      next: (res) => {
        this.businessCategories = res.data;
      },
      error: (err) => {
        console.error('Failed to load business categories', err);
      },
    });
  }

  onLogoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.selectedLogoFile = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
    };
    reader.readAsDataURL(file);

    // Reset form control value since file upload happens on submit
    this.registerForm.patchValue({ logo: '' });
  }

  onProfileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.selectedProfileFile = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.profilePreview = reader.result as string;
    };
    reader.readAsDataURL(file);

    // Reset profile_image form control until upload happens
    this.registerForm.patchValue({ profile_image: '' });
  }

  async onSubmit(): Promise<void> {
    if (this.registerForm.invalid || this.isSubmitting) return;

    this.isSubmitting = true;

    try {
      // Upload logo if selected
      if (this.selectedLogoFile) {
        const logoForm = new FormData();
        logoForm.append('logo', this.selectedLogoFile);
        const logoRes = await this.http.post<{ path: string }>(this.logoUploadUrl, logoForm).toPromise();
        if (logoRes?.path) {
          this.registerForm.patchValue({ logo: logoRes.path.replace(/\\/g, '/') });
        }
      }

      // Upload profile image if selected
      if (this.selectedProfileFile) {
        const profileForm = new FormData();
        profileForm.append('profile_image', this.selectedProfileFile);
        const profileRes = await this.http.post<{ path: string }>(this.profileUploadUrl, profileForm).toPromise();
        if (profileRes?.path) {
          this.registerForm.patchValue({ profile_image: profileRes.path.replace(/\\/g, '/') });
        }
      }

      const sellerData = this.registerForm.getRawValue(); // include disabled controls if any

      // Send registration request
      await this.http.post(this.registerSellerUrl, sellerData).toPromise();

      Swal.fire('Success', 'Seller registered successfully.', 'success');
      this.router.navigate(['/seller/login']);
    } catch (error) {
      console.error('Registration failed', error);
      Swal.fire('Error', 'Failed to register seller.', 'error');
    } finally {
      this.isSubmitting = false;
    }
  }
}
