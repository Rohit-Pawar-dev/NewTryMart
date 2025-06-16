import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { CategoryService } from '../../../../app/services/category.service';
import { SubCategoryService } from '../../../../app/services/sub-category.service';
  import { forkJoin } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-sub-category-edit',
  templateUrl: './sub-category-edit.component.html',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
})
export class SubCategoryEditComponent implements OnInit {
  form: FormGroup;
  id: string = '';
  isSubmitting = false;
  categories: any[] = [];

  imagePreview: string | null = null;
  isUploading = false;
  uploadError: string | null = null;

  private uploadUrl = `${environment.apiUrl}/upload-media`;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private subCategoryService: SubCategoryService,
    private categoryService: CategoryService,
    private router: Router,
    private http: HttpClient
  ) {
    this.form = this.fb.group({
      category_id: ['', Validators.required],
      name: ['', Validators.required],
      image: ['', Validators.required],
      status: ['', Validators.required],
    });
  }


ngOnInit(): void {
  this.id = this.route.snapshot.params['id'];

  forkJoin({
    subCategory: this.subCategoryService.getSubCategory(this.id),
    categories: this.categoryService.getCategories({ all: true }),
  }).subscribe(({ subCategory, categories }) => {
    this.categories = categories;

    const categoryId =
      typeof subCategory.category_id === 'string'
        ? subCategory.category_id
        : subCategory.category_id?._id;

    this.form.patchValue({
      ...subCategory,
      category_id: categoryId,
    });

    this.imagePreview = subCategory.image;
  });
}


  submit(): void {
    if (this.form.invalid || this.isSubmitting) return;

    this.isSubmitting = true;

    this.subCategoryService.updateSubCategory(this.id, this.form.value).subscribe({
      next: () => this.router.navigate(['/subcategories']),
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
    formData.append('type', 'subcategory');
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
