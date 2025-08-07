import { Component, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BannerService } from '../../../../app/services/banner.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import Swal from 'sweetalert2';

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

  selectedImageFile: File | null = null;
  selectedVideoFile: File | null = null;

  previewImage: string | null = null;
  previewVideo: string | null = null;

  todayString = new Date().toISOString().split('T')[0];
  private uploadUrl = `${environment.apiUrl}/banners/upload`; // Updated URL

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
      banner_type: ['main_banner', Validators.required],
      start_date: [null],
      end_date: [null],
      pop_up_time: [null],
    });

    this.form.get('banner_type')?.valueChanges.subscribe((type) => {
      this.setConditionalValidators(type);
    });

    this.setConditionalValidators(this.form.get('banner_type')?.value);
  }

  private setConditionalValidators(type: string): void {
    const image = this.form.get('image');
    const video = this.form.get('video');
    const start = this.form.get('start_date');
    const end = this.form.get('end_date');
    const popup = this.form.get('pop_up_time');

    image?.clearValidators();
    video?.clearValidators();
    start?.clearValidators();
    end?.clearValidators();
    popup?.clearValidators();

    if (type === 'ads_video_banner') {
      image?.setValidators([Validators.required]);
      video?.setValidators([Validators.required]);
      start?.setValidators([Validators.required]);
      end?.setValidators([Validators.required]);
    } else if (type === 'popup_banner') {
      image?.setValidators([Validators.required]);
      start?.setValidators([Validators.required]);
      end?.setValidators([Validators.required]);
      popup?.setValidators([Validators.required]);
    } else if (type === 'ads_img_banner') {
      image?.setValidators([Validators.required]);
      start?.setValidators([Validators.required]);
      end?.setValidators([Validators.required]);
    } else if (type === 'main_banner') {
      image?.setValidators([Validators.required]);
      this.form.patchValue({
        start_date: null,
        end_date: null,
        pop_up_time: null,
      });
    }

    image?.updateValueAndValidity();
    video?.updateValueAndValidity();
    start?.updateValueAndValidity();
    end?.updateValueAndValidity();
    popup?.updateValueAndValidity();
  }

  onFileSelected(event: Event, type: 'image' | 'video'): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (type === 'image') {
      this.selectedImageFile = file;
      this.previewImage = URL.createObjectURL(file);
      this.form.patchValue({ image: 'selected' }); // flag for validation
    } else {
      this.selectedVideoFile = file;
      this.previewVideo = URL.createObjectURL(file);
      this.form.patchValue({ video: 'selected' }); // flag for validation
    }
  }

  submit(): void {
    if (this.form.invalid || this.isSubmitting) return;

    Swal.fire({
      title: 'Confirm Submission',
      text: 'Are you sure you want to add this banner?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, submit',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        this.uploadAndSubmit();
      }
    });
  }

  private uploadAndSubmit(): void {
    this.isSubmitting = true;
    this.uploadError = null;

    const uploadFiles = async (): Promise<void> => {
      try {
        if (this.selectedImageFile) {
          const imgUrl = await this.uploadFile(this.selectedImageFile);
          this.form.patchValue({ image: imgUrl });
        }

        if (this.selectedVideoFile) {
          const vidUrl = await this.uploadFile(this.selectedVideoFile);
          this.form.patchValue({ video: vidUrl });
        }

        this.finalizeSubmit();
      } catch (err) {
        console.error('Upload failed', err);
        this.uploadError = 'File upload failed. Please try again.';
        this.isUploading = false;
        this.isSubmitting = false;
        Swal.fire('Upload Failed', this.uploadError, 'error');
      }
    };

    uploadFiles();
  }

  private uploadFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file); // backend expects 'file'

      this.isUploading = true;

      this.http.post<{ path: string }>(this.uploadUrl, formData).subscribe({
        next: (res) => {
          this.isUploading = false;
          resolve(res.path.replace(/\\/g, '/'));
        },
        error: (err) => {
          this.isUploading = false;
          reject(err);
        },
      });
    });
  }

  private finalizeSubmit(): void {
    const payload = { ...this.form.value };

    if (payload.banner_type === 'main_banner') {
      payload.start_date = null;
      payload.end_date = null;
      payload.pop_up_time = null;
    }

    if (payload.banner_type !== 'popup_banner') {
      payload.pop_up_time = null;
    }

    if (payload.banner_type !== 'ads_video_banner') {
      payload.video = null;
    }

    this.bannerService.createBanner(payload).subscribe({
      next: () => {
        Swal.fire('Success', 'Banner created successfully!', 'success').then(() =>
          this.router.navigate(['/admin/banners'])
        );
      },
      error: (err) => {
        console.error('Create failed', err);
        this.isSubmitting = false;
        Swal.fire({
          title: 'Error',
          text: err.error?.error || 'Failed to create banner. Please try again.',
          icon: 'error',
          confirmButtonText: 'OK',
        });
      },
    });
  }

  ngOnDestroy(): void {
    if (this.previewImage) URL.revokeObjectURL(this.previewImage);
    if (this.previewVideo) URL.revokeObjectURL(this.previewVideo);
  }
}
