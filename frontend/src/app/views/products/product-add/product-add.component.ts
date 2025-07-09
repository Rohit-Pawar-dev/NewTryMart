import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import {
  ProductService,
  Category,
  SubCategory,
} from '../../../services/product.service';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import Swal from 'sweetalert2';

@Component({
  standalone: true,
  selector: 'app-product-add',
  templateUrl: './product-add.component.html',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, CKEditorModule],
})
export class ProductAddComponent implements OnInit {
  public Editor = ClassicEditor;
  form: FormGroup;
  isSubmitting = false;
  isUploading = false;
  isPhotosUploading = false;
  uploadError: string | null = null;

  imagePreview: string | null = null;
  photoPreviews: string[] = [];

  categories: Category[] = [];
  subcategories: SubCategory[] = [];

  private uploadUrl = `${environment.apiUrl}/upload-media`;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private router: Router,
    private http: HttpClient
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      slug: [''],
      seller_id: [null],
      added_by: ['admin'], // ✅ Set default to admin
      category_id: ['', Validators.required],
      sub_category_id: [''],
      thumbnail: ['', Validators.required],
      images: [[]],
      unit: ['piece'],
      unit_price: [0, [Validators.required, Validators.min(0)]],
      tax: [0, Validators.min(0)],
      discount_type: ['percent'],
      discount: [0, Validators.min(0)],
      min_qty: [1, [Validators.required, Validators.min(1)]],
      current_stock: [0, Validators.min(0)],
      description: [''],
    });
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.productService.getAllCategories().subscribe({
      next: (res) => {
        this.categories = res.data;
      },
      error: (err) => {
        console.error('Error loading categories:', err);
      },
    });
  }

  onCategoryChange(): void {
    const catId = this.form.get('category_id')?.value;
    const selected = this.categories.find((cat) => cat._id === catId);
    this.subcategories = selected?.sub_categories || [];
    this.form.patchValue({ sub_category_id: '' });
  }

  onImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('type', 'product');
    formData.append('file', file);

    this.isUploading = true;
    this.http.post<{ file: string }>(this.uploadUrl, formData).subscribe({
      next: (res) => {
        const url = res.file.replace(/\\/g, '/');
        this.form.patchValue({ thumbnail: url });
        this.imagePreview = url;
        this.isUploading = false;
      },
      error: (err) => {
        console.error('Thumbnail upload error:', err);
        this.uploadError = 'Failed to upload thumbnail';
        this.isUploading = false;
        Swal.fire('Upload Failed', 'Failed to upload thumbnail.', 'error');
      },
    });
  }

  onMultiplePhotosSelected(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (!files || files.length === 0) return;

    this.isPhotosUploading = true;

    const uploadPromises = Array.from(files).map((file) => {
      const formData = new FormData();
      formData.append('type', 'product');
      formData.append('file', file);
      return this.http
        .post<{ file: string }>(this.uploadUrl, formData)
        .toPromise();
    });

    Promise.all(uploadPromises)
      .then((results) => {
        const urls = results
          .filter((res): res is { file: string } => !!res)
          .map((res) => res.file.replace(/\\/g, '/'));

        this.photoPreviews.push(...urls);
        const currentImages = this.form.get('images')?.value || [];
        this.form.patchValue({ images: [...currentImages, ...urls] });
        this.isPhotosUploading = false;
      })
      .catch((err) => {
        console.error('Photos upload error:', err);
        this.isPhotosUploading = false;
        Swal.fire('Upload Failed', 'Failed to upload some photos.', 'error');
      });
  }

  removeThumbnail(): void {
    this.imagePreview = null;
    this.form.patchValue({ thumbnail: '' });
  }

  removePhoto(index: number): void {
    this.photoPreviews.splice(index, 1);
    const updatedImages = this.form
      .get('images')
      ?.value.filter((_: string, i: number) => i !== index);
    this.form.patchValue({ images: updatedImages });
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-]/g, '');
  }

  submit(): void {
    if (this.isSubmitting || this.isUploading || this.isPhotosUploading) {
      Swal.fire('Please wait', 'Upload or submission in progress.', 'info');
      return;
    }

    const name = this.form.get('name')?.value || '';
    if (!this.form.get('slug')?.value) {
      this.form.patchValue({ slug: this.generateSlug(name) });
    }

    Swal.fire({
      title: 'Confirm Product Creation',
      text: 'Are you sure you want to create this product?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, create it',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        this.executeSubmit();
      }
    });
  }

  private executeSubmit(): void {
    this.isSubmitting = true;

    // ✅ Enforce admin attribution in case form is tampered with
    this.form.patchValue({ added_by: 'admin' });

    this.productService.createProduct(this.form.value).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Product Created',
          text: 'The product has been successfully created.',
        }).then(() => {
          this.router.navigate(['/products']);
        });
      },
      error: (err) => {
        console.error('Product creation error:', err);
        this.isSubmitting = false;
        Swal.fire(
          'Creation Failed',
          'Failed to create product. Please try again.',
          'error'
        );
      },
    });
  }
}
