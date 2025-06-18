// banner-add.component.ts
import { Component, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BannerService } from '../../../../app/services/banner.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  standalone: true,
  selector: 'app-banner-add',
  templateUrl: './banner-add.component.html',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
})
export class BannerAddComponent implements OnDestroy {
  form: FormGroup;
  isSubmitting = false;
  isUploading = false;
  uploadError: string | null = null;
  preview: string | null = null;
  selectedFile: File | null = null;

  private uploadUrl = `${environment.apiUrl}/upload-media`;

  constructor(
    private fb: FormBuilder,
    private bannerService: BannerService,
    private router: Router,
    private http: HttpClient
  ) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      image: [''],
      video: [''],
      status: ['active', Validators.required],
      banner_type: ['main', Validators.required],
    });

    this.form.get('banner_type')?.valueChanges.subscribe((type) => {
      if (type === 'advertisementVideo') {
        this.form.get('video')?.setValidators([Validators.required]);
        this.form.get('image')?.clearValidators();
        this.form.get('image')?.setValue('');
      } else {
        this.form.get('image')?.setValidators([Validators.required]);
        this.form.get('video')?.clearValidators();
        this.form.get('video')?.setValue('');
      }
      this.form.get('image')?.updateValueAndValidity();
      this.form.get('video')?.updateValueAndValidity();
    });
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.selectedFile = file;
    const type = this.form.get('banner_type')?.value;

    // Set preview as blob URL for image/video
    this.preview = URL.createObjectURL(file);

    if (type === 'advertisementVideo') {
      this.form.patchValue({ video: 'selected' });
    } else {
      this.form.patchValue({ image: 'selected' });
    }
  }

  submit(): void {
    if (this.form.invalid || this.isSubmitting) return;

    this.isSubmitting = true;
    this.uploadError = null;

    const createBanner = () => {
      this.bannerService.createBanner(this.form.value).subscribe({
        next: () => this.router.navigate(['/banners']),
        error: (err) => {
          console.error('Banner creation failed', err);
          this.isSubmitting = false;
        },
      });
    };

    if (this.selectedFile) {
      const formData = new FormData();
      formData.append('type', 'banner');
      formData.append('file', this.selectedFile);

      this.isUploading = true;

      this.http.post<{ file: string }>(this.uploadUrl, formData).subscribe({
        next: (res) => {
          const normalizedUrl = res.file.replace(/\\/g, '/');
          const type = this.form.get('banner_type')?.value;

          if (type === 'advertisementVideo') {
            this.form.patchValue({ video: normalizedUrl });
          } else {
            this.form.patchValue({ image: normalizedUrl });
          }

          this.isUploading = false;
          createBanner();
        },
        error: (err) => {
          console.error('File upload failed', err);
          this.uploadError = 'Upload failed';
          this.isUploading = false;
          this.isSubmitting = false;
        },
      });
    } else {
      this.uploadError = 'Please select a file';
      this.isSubmitting = false;
    }
  }

  ngOnDestroy(): void {
    if (this.preview) {
      URL.revokeObjectURL(this.preview);
    }
  }
}
