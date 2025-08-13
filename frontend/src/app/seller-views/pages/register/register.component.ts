import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SellerAuthService } from '../../../services/sellerAuth.service';
import Swal from 'sweetalert2';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

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
  selectedLogo: File | null = null;
  selectedProfileImage: File | null = null;
  logoPreview: string | null = null;
  profileImagePreview: string | null = null;

  private apiUrl = `${environment.apiUrl}/sellers`;
  public uploadLogoUrl = `${this.apiUrl}/upload/logo`;
  private uploadProfileImageUrl = `${this.apiUrl}/upload/profile`;

  constructor(
    private fb: FormBuilder,
    private sellerAuthService: SellerAuthService,
    private router: Router,
    private http: HttpClient
  ) {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      gender: ['male', Validators.required],
      mobile: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      email: ['', [Validators.email]],
      shop_name: ['', Validators.required],
      address: ['', Validators.required],
      country: [''],
      state: [''],
      city: ['', Validators.required],
      pincode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      business_category: ['', Validators.required],
      gst_number: [''],
      gst_registration_type: ['Unregistered'],
      gst_verified: [false],
      password: [''],
      logo: ['', Validators.required],
      profile_image: ['']
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
  onLogoSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedLogo = file;
      this.registerForm.patchValue({ logo: file.name });
      this.registerForm.get('logo')?.updateValueAndValidity();

      const reader = new FileReader();
      reader.onload = () => {
        this.logoPreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }


  onProfileImageSelected(event: any) {
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

  async onSubmit() {
    if (this.registerForm.invalid) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid input',
        text: 'Please fill all required fields correctly.'
      });
      return;
    }

    if (!this.selectedLogo) {
      Swal.fire('Error', 'Please upload a shop logo (mandatory).', 'error');
      return;
    }

    this.submitting = true;

    try {
      // Upload logo
      const logoFormData = new FormData();
      logoFormData.append('logo', this.selectedLogo as File);
      const logoUploadRes: any = await this.http
        .post(this.uploadLogoUrl, logoFormData)
        .toPromise();
      const logoPath = logoUploadRes.path;

      let profileImagePath = '';
      if (this.selectedProfileImage) {
        const profileFormData = new FormData();
        profileFormData.append('profile_image', this.selectedProfileImage);
        const profileUploadRes: any = await this.http
          .post(this.uploadProfileImageUrl, profileFormData)
          .toPromise();
        profileImagePath = profileUploadRes.path;
      }

      const formData = {
        ...this.registerForm.value,
        logo: logoPath,
        profile_image: profileImagePath || ''
      };

      this.sellerAuthService.registerSeller(formData).subscribe({
        next: (response) => {
          this.submitting = false;
          Swal.fire({
            icon: 'success',
            title: 'Registration Successful',
            text: response.message || 'Seller registered successfully. Please wait for admin approval.'
          }).then(() => {
            this.router.navigate(['/seller/login']);
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
    } catch (error) {
      console.error(error);
      this.submitting = false;
      Swal.fire('Error', 'Image upload failed. Please try again.', 'error');
    }
  }
}
