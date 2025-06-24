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

import { UserService, User } from '../../../services/user.service';
import { environment } from '../../../../environments/environment'; // update path if needed

// Import SweetAlert2
import Swal from 'sweetalert2';

@Component({
  standalone: true,
  selector: 'app-user-add',
  templateUrl: './user-add.component.html',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
})
export class UserAddComponent implements OnInit {
  selectedFile: File | null = null;
  userForm: FormGroup;
  isSubmitting = false;
  isUploading = false;
  uploadError: string | null = null;
  imagePreview: string | null = null;
  private uploadUrl = `${environment.apiUrl}/upload-media`;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router,
    private http: HttpClient
  ) {
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      mobile: ['', Validators.required],
      gender: ['', Validators.required], // <-- Added gender
      status: ['active', Validators.required],
      profilePicture: [''],
    });
  }

  ngOnInit(): void {}

  onImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.selectedFile = file;

    // Patch placeholder to satisfy validation (optional)
    this.userForm.patchValue({ profilePicture: 'selected' });

    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  onSubmit(): void {
    if (this.userForm.invalid || this.isSubmitting) return;

    this.isSubmitting = true;
    this.uploadError = null;

    const createUser = () => {
      const newUser: User = this.userForm.value;
      this.userService.createUser(newUser).subscribe({
        next: () => {
          Swal.fire('Success', 'User created successfully!', 'success');
          this.router.navigate(['/users']);
        },
        error: (error) => {
          console.error('Error creating user:', error);
          Swal.fire('Error', 'Failed to create user.', 'error');
          this.isSubmitting = false;
        },
      });
    };

    if (this.selectedFile) {
      const formData = new FormData();
      formData.append('type', 'profile');
      formData.append('file', this.selectedFile);

      this.isUploading = true;

      this.http.post<{ file: string }>(this.uploadUrl, formData).subscribe({
        next: (res) => {
          const normalizedUrl = res.file.replace(/\\/g, '/');
          this.userForm.patchValue({ profilePicture: normalizedUrl });
          this.isUploading = false;
          createUser(); // Create user after image upload
        },
        error: (err) => {
          console.error('Upload failed', err);
          Swal.fire('Error', 'Image upload failed.', 'error');
          this.uploadError = 'Image upload failed';
          this.isUploading = false;
          this.isSubmitting = false;
        },
      });
    } else {
      createUser(); // No image selected, just create the user
    }
  }
}
