import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminProfileService } from '../../services/adminProfile.service';
import { environment } from '../../../environments/environment';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-profile.component.html',
})
export class AdminProfileComponent implements OnInit {
  adminId: string = '';
  isLoading = true;
  error: string | null = null;

  admin = {
    name: '',
    email: '',
    mobile: '',
    image: '',
  };

  selectedImage: File | null = null;
  previewUrl: string | ArrayBuffer | null = null;

  passwordForm = {
    oldPassword: '',
    newPassword: '',
  };

  constructor(private adminService: AdminProfileService) { }

  ngOnInit(): void {
    const storedProfile = localStorage.getItem('profile');
    try {
      if (storedProfile) {
        const parsedProfile = JSON.parse(storedProfile);
        this.adminId = parsedProfile?.id || parsedProfile?._id || '';
      }
    } catch (e) {
      console.error('Invalid profile JSON in localStorage');
      this.error = 'Invalid admin profile stored.';
      return;
    }

    if (!this.adminId) {
      this.error = 'Admin ID not found in local storage.';
      Swal.fire('Error', this.error, 'error');
      return;
    }

    this.fetchAdmin();
  }

  fetchAdmin() {
    this.isLoading = true;
    this.error = null;

    this.adminService.getAdminById(this.adminId).subscribe({
      next: (res) => {
        console.log('Admin API response:', res);

        const adminData = res?.data || res?.admin;

        if (res?.status && adminData) {
          this.admin = adminData;

          if (this.admin.image && !this.admin.image.startsWith('http')) {
            const baseUrl = environment.apiUrl.replace('/api', '');
            this.admin.image = `${baseUrl}${this.admin.image}`;
          }

          this.isLoading = false;
        } else {
          this.error = 'Unexpected API response structure';
          this.isLoading = false;
          Swal.fire('Error', this.error, 'error');
        }
      },
      error: (err) => {
        console.error('Fetch Error:', err);
        this.error = 'Failed to fetch profile';
        this.isLoading = false;
        Swal.fire('Error', this.error, 'error');
      },
    });
  }

  onFileChange(event: any) {
    this.selectedImage = event.target.files[0] || null;

    if (this.selectedImage) {
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result;
      };
      reader.readAsDataURL(this.selectedImage);
    } else {
      this.previewUrl = null;
    }
  }

  onProfileSubmit() {
    if (!this.admin.name || !this.admin.email || !this.admin.mobile) {
      Swal.fire('Warning', 'All profile fields are required', 'warning');
      return;
    }

    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to update your profile?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, update it!',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        const formData = new FormData();
        formData.append('name', this.admin.name);
        formData.append('email', this.admin.email);
        formData.append('mobile', this.admin.mobile);
        if (this.selectedImage) {
          formData.append('image', this.selectedImage);
        }

        this.adminService.updateAdmin(this.adminId, formData).subscribe({
          next: () => {
            Swal.fire('Success', 'Profile updated successfully!', 'success');
            this.fetchAdmin();
          },
          error: (err) => {
            console.error('Update Error:', err);
            Swal.fire('Error', 'Failed to update profile', 'error');
          },
        });
      }
    });
  }

  onPasswordChange() {
    const { oldPassword, newPassword } = this.passwordForm;

    if (!oldPassword || !newPassword) {
      Swal.fire(
        'Warning',
        'Please enter both old and new passwords.',
        'warning'
      );
      return;
    }

    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to change your password?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, change it!',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        this.adminService
          .changePassword(this.adminId, this.passwordForm)
          .subscribe({
            next: () => {
              Swal.fire('Success', 'Password changed successfully!', 'success');
              this.passwordForm = { oldPassword: '', newPassword: '' };
            },
            error: (err) => {
              console.error('Password Change Error:', err);
              Swal.fire(
                'Error',
                'Old password incorrect or update failed',
                'error'
              );
            },
          });
      }
    });
  }
}
