import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CategoryService } from '../../../../app/services/category.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  standalone: true,
  selector: 'app-category-add',
  templateUrl: './category-add.component.html',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
})
export class CategoryAddComponent {
  form: FormGroup;
  isSubmitting = false;
  isUploading = false;
  uploadError: string | null = null;
  imagePreview: string | null = null;
  selectedFile: File | null = null; // ✅ store file temporarily

  private uploadUrl = `${environment.apiUrl}/upload-media`;

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private router: Router,
    private http: HttpClient
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      image: ['', Validators.required],
      status: ['active', Validators.required],
    });
  }

  onImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.selectedFile = file;
    this.form.patchValue({ image: 'selected' }); // satisfies form validation

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

    const finalizeSubmit = () => {
      this.categoryService.createCategory(this.form.value).subscribe({
        next: () => this.router.navigate(['/categories']),
        error: () => {
          this.isSubmitting = false;
        },
      });
    };

    if (this.selectedFile) {
      this.isUploading = true;
      const formData = new FormData();
      formData.append('file', this.selectedFile);
      formData.append('type', 'category');

      this.http.post<{ file: string }>(this.uploadUrl, formData).subscribe({
        next: (res) => {
          const normalizedUrl = res.file.replace(/\\/g, '/');
          this.form.patchValue({ image: normalizedUrl });
          this.isUploading = false;
          finalizeSubmit(); // ✅ only submit after image upload success
        },
        error: (err) => {
          console.error('Upload failed', err);
          this.uploadError = 'Image upload failed';
          this.isUploading = false;
          this.isSubmitting = false;
        },
      });
    } else {
      finalizeSubmit(); // ✅ no image uploaded, just submit
    }
  }
}
