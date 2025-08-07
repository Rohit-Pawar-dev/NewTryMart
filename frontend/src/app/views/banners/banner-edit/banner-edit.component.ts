import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BannerService, Banner } from '../../../../app/services/banner.service';
import { ActivatedRoute, Router } from '@angular/router';
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
  isSubmitting = false;
  isUploading = false;
  uploadError: string | null = null;
  mediaUrl = environment.mediaUrl;

  selectedImageFile: File | null = null;
  selectedVideoFile: File | null = null;

  previewImage: string | null = null;
  previewVideo: string | null = null;

  bannerId: string | null = null;
  bannerData: Banner | null = null;

  todayString = new Date().toISOString().split('T')[0];
   private uploadUrl = `${environment.apiUrl}/banners/upload`

  constructor(
    private fb: FormBuilder,
    private bannerService: BannerService,
    private route: ActivatedRoute,
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
  }

  ngOnInit(): void {
    this.bannerId = this.route.snapshot.paramMap.get('id');
    if (this.bannerId) {
      this.loadBanner(this.bannerId);
    }
  }

  private loadBanner(id: string): void {
    this.bannerService.getBanner(id).subscribe({
      next: (banner) => {
        this.bannerData = banner;

        // Patch form values
        this.form.patchValue({
          title: banner.title,
          image: banner.image || '',
          video: banner.video || '',
          status: banner.status,
          banner_type: banner.banner_type,
          start_date: banner.start_date || null,
          end_date: banner.end_date || null,
          pop_up_time: banner.pop_up_time || null,
        });

        // Setup previews if existing
        if (banner.image) {
          this.previewImage = banner.image ? this.mediaUrl+ banner.image : null;
        }
        if (banner.video) {
          this.previewVideo = banner.video ? this.mediaUrl +banner.video : null;
        }

        // Setup validators for current banner_type
        this.setConditionalValidators(banner.banner_type);
      },
      error: (err) => {
        console.error('Failed to load banner', err);
        Swal.fire('Error', 'Failed to load banner data.', 'error').then(() => this.router.navigate(['/admin/banners']));
      },
    });
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
      this.form.patchValue({ start_date: null, end_date: null, pop_up_time: null });
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
      this.form.patchValue({ image: 'selected' }); // mark changed
    } else {
      this.selectedVideoFile = file;
      this.previewVideo = URL.createObjectURL(file);
      this.form.patchValue({ video: 'selected' }); // mark changed
    }
  }

  submit(): void {
    if (this.form.invalid || this.isSubmitting) return;

    Swal.fire({
      title: 'Confirm Update',
      text: 'Are you sure you want to update this banner?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, update',
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
        } else if (this.bannerData?.image) {
          this.form.patchValue({ image: this.bannerData.image });
        }

        if (this.selectedVideoFile) {
          const vidUrl = await this.uploadFile(this.selectedVideoFile);
          this.form.patchValue({ video: vidUrl });
        } else if (this.bannerData?.video) {
          this.form.patchValue({ video: this.bannerData.video });
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
      formData.append('type', 'banner');
      formData.append('file', file);

      this.isUploading = true;

      this.http.post<{ path: string }>(this.uploadUrl, formData).subscribe({
        next: (res) => {
          this.isUploading = false;
          resolve(res.path.replace(/\\/g, '/'));
        },
        error: (err) => {
          reject(err);
        },
      });
    });
  }

  private finalizeSubmit(): void {
    if (!this.bannerId) {
      this.isSubmitting = false;
      Swal.fire('Error', 'Invalid banner ID.', 'error');
      return;
    }

    const payload = { ...this.form.value };

    // Cleanup unnecessary fields same as add component
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

    this.bannerService.updateBanner(this.bannerId, payload).subscribe({
      next: () => {
        Swal.fire('Success', 'Banner updated successfully!', 'success').then(() =>
          this.router.navigate(['/admin/banners'])
        );
      },
      error: (err) => {
        console.error('Update failed', err);
        this.isSubmitting = false;
        Swal.fire('Error', 'Failed to update banner. Please try again.', 'error');
      },
    });
  }

  ngOnDestroy(): void {
    if (this.previewImage && this.selectedImageFile) URL.revokeObjectURL(this.previewImage);
    if (this.previewVideo && this.selectedVideoFile) URL.revokeObjectURL(this.previewVideo);
  }
}
