import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { UserService, User } from '../../../services/user.service';
import { environment } from '../../../../environments/environment'; // Adjust path if needed

@Component({
  standalone: true,
  selector: 'app-user-edit',
  templateUrl: './user-edit.component.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
  ]
})
export class UserEditComponent implements OnInit {
  userForm: FormGroup;
  isSubmitting = false;
  isUploading = false;
  uploadError: string | null = null;
  imagePreview: string | null = null;
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
      this.userService.getUser(this.userId).subscribe(
        (user) => {
          this.userForm.patchValue({
            name: user.name,
            email: user.email,
            mobile: user.mobile,
            status: user.status,
            profilePicture: user.profilePicture || ''
          });
          this.imagePreview = user.profilePicture || null;
        },
        (error) => {
          console.error('Error loading user:', error);
        }
      );
    }
  }

  onImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('type', 'profile');
    formData.append('file', file);

    this.isUploading = true;
    this.uploadError = null;

    this.http.post<{ file: string }>(this.uploadUrl, formData).subscribe({
      next: (res) => {
        const fileUrl = res.file.replace(/\\/g, '/');
        this.userForm.patchValue({ profilePicture: fileUrl });
        this.imagePreview = fileUrl;
        this.isUploading = false;
      },
      error: (err) => {
        console.error('Image upload failed:', err);
        this.uploadError = 'Failed to upload image';
        this.isUploading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.userForm.valid && this.userId) {
      this.isSubmitting = true;
      const updatedUser: Partial<User> = this.userForm.value;

      this.userService.updateUser(this.userId, updatedUser).subscribe({
        next: () => this.router.navigate(['/users']),
        error: (error) => {
          console.error('Error updating user:', error);
          this.isSubmitting = false;
        }
      });
    }
  }
}
