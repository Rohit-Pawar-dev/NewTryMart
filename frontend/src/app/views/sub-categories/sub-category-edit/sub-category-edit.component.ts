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

// Import SweetAlert2
import Swal from 'sweetalert2';

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
  selectedFile: File | null = null;

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
        image: subCategory.image || 'existing', // keep it non-empty
      });

      this.imagePreview = subCategory.image;
    });
  }

  onImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.selectedFile = file;
    this.form.patchValue({ image: 'selected' }); // pass validation

    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  submit(): void {
    if (this.form.invalid || this.isSubmitting) return;

    this.isSubmitting = true;

    const finalizeSubmit = () => {
      this.subCategoryService.updateSubCategory(this.id, this.form.value).subscribe({
        next: () => {
          Swal.fire('Success', 'Sub-category updated successfully!', 'success');
          this.router.navigate(['/sub-categories']);
        },
        error: () => {
          Swal.fire('Error', 'Failed to update sub-category.', 'error');
          this.isSubmitting = false;
        },
      });
    };

    if (this.selectedFile) {
      this.isUploading = true;
      const formData = new FormData();
      formData.append('file', this.selectedFile);
      formData.append('type', 'subcategory');

      this.http.post<{ file: string }>(this.uploadUrl, formData).subscribe({
        next: (res) => {
          const normalizedUrl = res.file.replace(/\\/g, '/');
          this.form.patchValue({ image: normalizedUrl });
          this.isUploading = false;
          finalizeSubmit();
        },
        error: () => {
          this.uploadError = 'Image upload failed';
          this.isUploading = false;
          this.isSubmitting = false;
        },
      });
    } else {
      finalizeSubmit();
    }
  }
}
