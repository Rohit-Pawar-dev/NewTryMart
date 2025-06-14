import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BannerService } from '../../../../app/services/banner.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment'; // adjust path if needed

@Component({
  standalone: true,
  selector: 'app-banner-add',
  templateUrl: './banner-add.component.html',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
})
export class BannerAddComponent {
  form: FormGroup;
  isSubmitting = false;
  isUploading = false;
  uploadError: string | null = null;
  imagePreview: string | null = null;

  private uploadUrl = `${environment.apiUrl}/upload-media`;

  constructor(
    private fb: FormBuilder,
    private bannerService: BannerService,
    private router: Router,
    private http: HttpClient
  ) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      image: ['', Validators.required],
      status: ['active', Validators.required],
    });
  }

  onImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('type', 'banner');
    formData.append('file', file);

    this.isUploading = true;
    this.uploadError = null;

    this.http.post<{ file: string }>(this.uploadUrl, formData).subscribe({
      next: (res) => {
        const normalizedUrl = res.file.replace(/\\/g, '/');
        this.form.patchValue({ image: normalizedUrl });
        this.imagePreview = normalizedUrl;
        this.isUploading = false;
      },
      error: (err) => {
        console.error('Upload failed', err);
        this.uploadError = 'Image upload failed';
        this.isUploading = false;
      },
    });
  }

  submit(): void {
    if (this.form.invalid || this.isSubmitting) return;

    this.isSubmitting = true;

    this.bannerService.createBanner(this.form.value).subscribe({
      next: () => this.router.navigate(['/banners']),
      error: () => {
        this.isSubmitting = false;
      },
    });
  }
}
