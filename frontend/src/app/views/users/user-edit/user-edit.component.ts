import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { UserService, User } from '../../../services/user.service';
import { environment } from '../../../../environments/environment';

// Import SweetAlert2
import Swal from 'sweetalert2';

@Component({
  standalone: true,
  selector: 'app-user-edit',
  templateUrl: './user-edit.component.html',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
})
export class UserEditComponent implements OnInit {
  userForm: FormGroup;
  isSubmitting = false;
  isUploading = false;
  uploadError: string | null = null;
  imagePreview: string | null = null;
  selectedFile: File | null = null; // ✅ Store image locally before upload
  userId: string | null = null;

  private uploadUrl = `${environment.apiUrl}/upload-media`;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient
  ) {
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      mobile: ['', Validators.required],
      status: ['active', Validators.required],
      profilePicture: ['']
    });
  }

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id');
    if (this.userId) {
      this.userService.getUser(this.userId).subscribe({
        next: (user) => {
          this.userForm.patchValue(user);
          this.imagePreview = user.profilePicture || null;
        },
        error: (err) => {
          console.error('Error loading user:', err);
        }
      });
    }
  }

  onImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.selectedFile = file;
    this.userForm.patchValue({ profilePicture: 'selected' }); // ✅ To satisfy validation

    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  onSubmit(): void {
    if (this.userForm.invalid || !this.userId) return;

    this.isSubmitting = true;
    this.uploadError = null;

    const finalizeUpdate = () => {
      const updatedUser: Partial<User> = this.userForm.value;
      this.userService.updateUser(this.userId!, updatedUser).subscribe({
        next: () => {
          Swal.fire('Success', 'User updated successfully!', 'success');
          this.router.navigate(['/users']);
        },
        error: (error) => {
          console.error('Error updating user:', error);
          Swal.fire('Error', 'Failed to update user.', 'error');
          this.isSubmitting = false;
        }
      });
    };

    if (this.selectedFile) {
      this.isUploading = true;
      const formData = new FormData();
      formData.append('file', this.selectedFile);
      formData.append('type', 'profile');

      this.http.post<{ file: string }>(this.uploadUrl, formData).subscribe({
        next: (res) => {
          const fileUrl = res.file.replace(/\\/g, '/');
          this.userForm.patchValue({ profilePicture: fileUrl });
          this.isUploading = false;
          finalizeUpdate(); // ✅ Continue after upload
        },
        error: (err) => {
          console.error('Image upload failed:', err);
          Swal.fire('Error', 'Failed to upload image.', 'error');
          this.uploadError = 'Failed to upload image';
          this.isUploading = false;
          this.isSubmitting = false;
        }
      });
    } else {
      finalizeUpdate(); // ✅ Continue directly if no new image
    }
  }
}
