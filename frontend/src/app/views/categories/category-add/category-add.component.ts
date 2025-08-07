import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CategoryService } from '../../../../app/services/category.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import Swal from 'sweetalert2';

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
  selectedFile: File | null = null;

  private uploadUrl = `${environment.apiUrl}/categories/upload-image`;

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private router: Router,
    private http: HttpClient
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      image: ['', Validators.required], // will store image URL from server
      status: ['active', Validators.required],
    });
  }

  onImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.selectedFile = file;
    this.form.patchValue({ image: 'uploading' }); // temporary to pass validation

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
        next: () => {
          Swal.fire('Success', 'Category created successfully!', 'success');
          this.router.navigate(['/admin/categories']);
        },
        error: () => {
          Swal.fire('Error', 'Failed to create category.', 'error');
          this.isSubmitting = false;
        },
      });
    };

    if (this.selectedFile) {
      this.isUploading = true;
      const formData = new FormData();
      formData.append('image', this.selectedFile);
      // formData.append('type', 'category'); // optional if your backend expects it

      this.http.post<{ path: string }>(this.uploadUrl, formData).subscribe({
        next: (res) => {
          // The backend should return { path: 'uploads/categories/image-name.jpg' }
          const normalizedUrl = res.path.replace(/\\/g, '/');
          this.form.patchValue({ image: normalizedUrl });
          this.isUploading = false;
          finalizeSubmit();
        },
        error: (err) => {
          console.error('Upload failed', err);
          this.uploadError = 'Image upload failed';
          this.isUploading = false;
          this.isSubmitting = false;
        },
      });
    } else {
      // No file selected, just submit (if allowed)
      finalizeSubmit();
    }
  }
}
