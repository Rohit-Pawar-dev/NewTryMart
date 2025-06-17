import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BannerService } from '../../../../app/services/banner.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment'; // ✅ Correct import

@Component({
  standalone: true,
  selector: 'app-banner-edit',
  templateUrl: './banner-edit.component.html',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
})
export class BannerEditComponent implements OnInit {
  form: FormGroup;
  id: string = '';
  isSubmitting: boolean = false;

  imagePreview: string | null = null;
  isUploading: boolean = false;
  uploadError: string | null = null;

  selectedFile: File | null = null; // ✅ Holds the file for deferred upload

  private uploadUrl = `${environment.apiUrl}/upload-media`; // ✅ Uses environment config

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private bannerService: BannerService,
    private router: Router,
    private http: HttpClient
  ) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      image: ['', Validators.required],
      status: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.id = this.route.snapshot.params['id'];
    this.bannerService.getBanner(this.id).subscribe((banner) => {
      this.form.patchValue(banner);
      this.imagePreview = banner.image;
    });
  }

  onImageSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    this.selectedFile = file;

    // Temporary patch for form validation
    this.form.patchValue({ image: 'selected' });

    // Preview image
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  submit(): void {
    if (this.form.invalid || this.isSubmitting) return;

    this.isSubmitting = true;
    this.uploadError = null;

    const finalizeUpdate = () => {
      this.bannerService.updateBanner(this.id, this.form.value).subscribe({
        next: () => this.router.navigate(['/banners']),
        error: () => {
          this.isSubmitting = false;
        }
      });
    };

    if (this.selectedFile) {
      this.isUploading = true;
      const formData = new FormData();
      formData.append('file', this.selectedFile);
      formData.append('type', 'banner'); // Optional if your API uses it

      this.http.post<{ file: string }>(this.uploadUrl, formData).subscribe({
        next: (res) => {
          const normalizedPath = res.file.replace(/\\/g, '/');
          this.form.patchValue({ image: normalizedPath });
          this.isUploading = false;
          finalizeUpdate();
        },
        error: () => {
          this.uploadError = 'Failed to upload image. Please try again.';
          this.isUploading = false;
          this.isSubmitting = false;
        }
      });
    } else {
      finalizeUpdate();
    }
  }
}
