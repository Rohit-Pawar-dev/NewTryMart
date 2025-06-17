import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { DeliveryManService } from '../../../services/delivery-man.service';
import { environment } from '../../../../environments/environment';

@Component({
  standalone: true,
  selector: 'app-delivery-man-add',
  templateUrl: './delivery-man-add.component.html',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
})
export class DeliveryManAddComponent implements OnInit {
  deliveryManForm: FormGroup;
  isSubmitting = false;
  isUploading = false;
  uploadError: string | null = null;

  imagePreview: string | null = null;
  licensePhotoPreview: string | null = null;
  identityProofPreview: string | null = null;

  private uploadUrl = `${environment.apiUrl}/upload-media`;

  constructor(
    private fb: FormBuilder,
    private deliveryManService: DeliveryManService,
    private router: Router,
    private http: HttpClient
  ) {
    this.deliveryManForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      mobile: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(10)]],
      gender: ['male', Validators.required],
      address: ['', Validators.required],
      image: ['', Validators.required],
      licenseNumber: ['', Validators.required],
      licensePhoto: ['', Validators.required],
      identityProofPhoto: ['', Validators.required],
      isAvailable: [true],
      status: ['active', Validators.required]
    });
  }

  ngOnInit(): void {}

  uploadFile(event: Event, field: string, previewField: keyof this): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('type', 'delivery-man');
    formData.append('file', file);

    this.isUploading = true;
    this.uploadError = null;

    this.http.post<{ file: string }>(this.uploadUrl, formData).subscribe({
      next: (res) => {
        const normalizedUrl = res.file.replace(/\\/g, '/');
        this.deliveryManForm.patchValue({ [field]: normalizedUrl });
        (this[previewField] as unknown as string) = normalizedUrl;
        this.isUploading = false;
      },
      error: (err) => {
        console.error('File upload failed', err);
        this.uploadError = 'File upload failed';
        this.isUploading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.deliveryManForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      const newMan = this.deliveryManForm.value;

      this.deliveryManService.createDeliveryMan(newMan).subscribe({
        next: () => this.router.navigate(['/delivery-men']),
        error: (err) => {
          console.error('Error creating delivery man:', err);
          this.isSubmitting = false;
        }
      });
    }
  }
}
