import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CategoryService, Category } from '../../../services/category.service';
import { SubCategoryService } from '../../../services/sub-category.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  standalone: true,
  selector: 'app-sub-category-add',
  templateUrl: './sub-category-add.component.html',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
})
export class SubCategoryAddComponent implements OnInit {
  form: FormGroup;
  categories: Category[] = [];
  isSubmitting = false;
  isUploading = false;
  uploadError: string | null = null;
  imagePreview: string | null = null;

  private uploadUrl = `${environment.apiUrl}/upload-media`;

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private subCategoryService: SubCategoryService,
    private router: Router,
    private http: HttpClient
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      category_id: ['', Validators.required],
      image: ['', Validators.required],
      status: ['active', Validators.required],
    });
  }

  ngOnInit(): void {
    this.categoryService.getCategories().subscribe({
      next: (data) => (this.categories = data),
      error: (err) => console.error('Failed to load categories', err),
    });
  }

  onImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('type', 'subcategory');
    formData.append('file', file);

    this.isUploading = true;
    this.uploadError = null;

    this.http.post<{ file: string }>(this.uploadUrl, formData).subscribe({
      next: (res) => {
        const normalizedUrl = res.file.replace(/\\/g, '/');
        this.form.patchValue({ image: normalizedUrl });
        this.imagePreview = normalizedUrl;
        this.isUploading = false;
      },
      error: (err) => {
        console.error('Upload failed', err);
        this.uploadError = 'Image upload failed';
        this.isUploading = false;
      },
    });
  }

  submit(): void {
    if (this.form.invalid || this.isSubmitting) return;

    this.isSubmitting = true;

    this.subCategoryService.createSubCategory(this.form.value).subscribe({
      next: () => this.router.navigate(['/sub-categories']),
      error: () => {
        this.isSubmitting = false;
      },
    });
  }
}
