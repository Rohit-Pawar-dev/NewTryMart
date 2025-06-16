import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { CategoryService } from '../../../../app/services/category.service';

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

  private uploadUrl = `${environment.apiUrl}/upload-media`;

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
      this.imagePreview = category.image;
    });
  }

  submit(): void {
    if (this.form.invalid || this.isSubmitting) return;

    this.isSubmitting = true;

    this.categoryService.updateCategory(this.id, this.form.value).subscribe({
      next: () => this.router.navigate(['/categories']),
      error: () => {
        this.isSubmitting = false;
      },
    });
  }

  onImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.isUploading = true;
    const formData = new FormData();
    formData.append('type', 'category');
    formData.append('file', file);

    this.http.post<{ file: string }>(this.uploadUrl, formData).subscribe({
      next: (res) => {
        const normalizedUrl = res.file.replace(/\\/g, '/');
        this.form.patchValue({ image: normalizedUrl });
        this.imagePreview = normalizedUrl;
        this.uploadError = null;
        this.isUploading = false;
      },
      error: () => {
        this.uploadError = 'Failed to upload image. Please try again.';
        this.isUploading = false;
      },
    });
  }
}
