import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { UserService, User } from '../../../services/user.service';
import { environment } from '../../../../environments/environment'; // update path if needed

@Component({
  standalone: true,
  selector: 'app-user-add',
  templateUrl: './user-add.component.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
  ]
})
export class UserAddComponent implements OnInit {
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
      password: ['', [Validators.required, Validators.minLength(8)]],
      status: ['active', Validators.required],
      profilePicture: ['']
    });
  }

  ngOnInit(): void {}

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
        const normalizedUrl = res.file.replace(/\\/g, '/');
        this.userForm.patchValue({ profilePicture: normalizedUrl });
        this.imagePreview = normalizedUrl;
        this.isUploading = false;
      },
      error: (err) => {
        console.error('Upload failed', err);
        this.uploadError = 'Image upload failed';
        this.isUploading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      this.isSubmitting = true;
      const newUser: User = this.userForm.value;

      this.userService.createUser(newUser).subscribe({
        next: () => this.router.navigate(['/users']),
        error: (error) => {
          console.error('Error creating user:', error);
          this.isSubmitting = false;
        }
      });
    }
  }
}
