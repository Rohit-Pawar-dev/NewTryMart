import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BannerService } from '../../../../app/services/banner.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import Swal from 'sweetalert2';

@Component({
  standalone: true,
  selector: 'app-banner-edit',
  templateUrl: './banner-edit.component.html',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
})
export class BannerEditComponent implements OnInit, OnDestroy {
  form: FormGroup;
  id: string = '';
  isSubmitting = false;
  isUploading = false;
  uploadError: string | null = null;

  preview: string | null = null;
  selectedFile: File | null = null;

  private uploadUrl = `${environment.apiUrl}/upload-media`;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private bannerService: BannerService,
    private router: Router,
    private http: HttpClient
  ) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      image: [''],
      video: [''],
      status: ['', Validators.required],
      banner_type: ['', Validators.required],
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

  ngOnInit(): void {
    this.id = this.route.snapshot.params['id'];
    this.bannerService.getBanner(this.id).subscribe({
      next: (banner) => {
        this.form.patchValue(banner);
        this.preview = null;
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load banner details.',
        });
      }
    });
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const type = this.form.get('banner_type')?.value;
    const isVideo = type === 'advertisementVideo';

    if (isVideo && !file.type.startsWith('video/')) {
      this.uploadError = 'Please select a valid video file.';
      Swal.fire('Invalid File', 'Please select a valid video.', 'error');
      return;
    }
    if (!isVideo && !file.type.startsWith('image/')) {
      this.uploadError = 'Please select a valid image file.';
      Swal.fire('Invalid File', 'Please select a valid image.', 'error');
      return;
    }

    this.selectedFile = file;
    this.uploadError = null;

    this.preview && URL.revokeObjectURL(this.preview);
    this.preview = URL.createObjectURL(file);

    if (isVideo) {
      this.form.patchValue({ video: 'selected' });
    } else {
      this.form.patchValue({ image: 'selected' });
    }
  }

  submit(): void {
    if (this.form.invalid || this.isSubmitting) return;

    this.isSubmitting = true;
    this.uploadError = null;

    const finalizeUpdate = () => {
      this.bannerService.updateBanner(this.id, this.form.value).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Banner Updated',
            text: 'The banner has been successfully updated.',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'OK',
          }).then(() => this.router.navigate(['/banners']));
        },
        error: () => {
          this.isSubmitting = false;
          Swal.fire({
            icon: 'error',
            title: 'Update Failed',
            text: 'Failed to update the banner. Please try again.',
          });
        },
      });
    };

    if (this.selectedFile) {
      this.isUploading = true;
      const formData = new FormData();
      formData.append('file', this.selectedFile);
      formData.append('type', 'banner');

      this.http.post<{ file: string }>(this.uploadUrl, formData).subscribe({
        next: (res) => {
          const normalizedPath = res.file.replace(/\\/g, '/');
          const type = this.form.get('banner_type')?.value;

          if (type === 'advertisementVideo') {
            this.form.patchValue({ video: normalizedPath });
          } else {
            this.form.patchValue({ image: normalizedPath });
          }

          this.isUploading = false;
          finalizeUpdate();
        },
        error: () => {
          this.uploadError = 'Media upload failed.';
          this.isUploading = false;
          this.isSubmitting = false;
          Swal.fire({
            icon: 'error',
            title: 'Upload Failed',
            text: 'Failed to upload media. Please try again.',
          });
        },
      });
    } else {
      finalizeUpdate();
    }
  }

  ngOnDestroy(): void {
    if (this.preview) {
      URL.revokeObjectURL(this.preview);
    }
  }
}
