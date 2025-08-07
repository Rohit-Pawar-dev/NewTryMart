import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { CategoryService } from '../../../../app/services/category.service';
import Swal from 'sweetalert2';

@Component({
  standalone: true,
  selector: 'app-category-edit',
  templateUrl: './category-edit.component.html',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
})
export class CategoryEditComponent implements OnInit {
  form: FormGroup;
  id: string = '';
  isSubmitting = false;

  imagePreview: string | null = null;
  isUploading = false;
  uploadError: string | null = null;
  selectedFile: File | null = null;

  private uploadUrl = `${environment.apiUrl}/categories/upload-image`;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private categoryService: CategoryService,
    private router: Router,
    private http: HttpClient
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      image: ['', Validators.required],
      status: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.id = this.route.snapshot.params['id'];
    this.categoryService.getCategory(this.id).subscribe((category) => {
      this.form.patchValue(category);
      this.imagePreview = category.image ? environment.mediaUrl+category.image : null;
    });
  }

  onImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.selectedFile = file;
    this.form.patchValue({ image: 'selected' });

    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
    };
    reader.readAsDataURL(file);

  }

  submit(): void {
    if (this.form.invalid || this.isSubmitting) return;

    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to update this category?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, update it!',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
    }).then((result) => {
      if (result.isConfirmed) {
        this.isSubmitting = true;

        const finalizeSubmit = () => {
          this.categoryService.updateCategory(this.id, this.form.value).subscribe({
            next: () => {
              Swal.fire({
                title: 'Updated!',
                text: 'Category updated successfully!',
                icon: 'success',
                confirmButtonColor: '#3085d6',
              }).then(() => {
                this.router.navigate(['/admin/categories']);
              });
            },
            error: () => {
              this.isSubmitting = false;
              Swal.fire('Error', 'Failed to update category', 'error');
            },
          });
        };

        if (this.selectedFile) {
          this.isUploading = true;
          const formData = new FormData();
          formData.append('image', this.selectedFile);
          formData.append('type', 'category');

          this.http.post<{ path: string }>(this.uploadUrl, formData).subscribe({
            next: (res) => {
              const normalizedUrl = res.path.replace(/\\/g, '/');
              this.form.patchValue({ image: normalizedUrl });
              this.isUploading = false;
              finalizeSubmit();
            },
            error: () => {
              this.uploadError = 'Failed to upload image. Please try again.';
              this.isUploading = false;
              this.isSubmitting = false;
              Swal.fire('Error', this.uploadError, 'error');
            },
          });
        } else {
          finalizeSubmit();
        }
      }
    });
  }
}
