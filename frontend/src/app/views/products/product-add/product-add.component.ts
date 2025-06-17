// product-add.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { ProductService, Category, SubCategory } from '../../../services/product.service';

@Component({
  standalone: true,
  selector: 'app-product-add',
  templateUrl: './product-add.component.html',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
})
export class ProductAddComponent implements OnInit {
  form: FormGroup;
  isSubmitting = false;
  isUploading = false;
  isPhotosUploading = false;
  uploadError: string | null = null;

  imagePreview: string | null = null;
  photoPreviews: string[] = [];
  photoInputs: number[] = [0];

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
      category_id: ['', Validators.required],
      sub_category_id: [''],
      thumbnail: ['', Validators.required],
      images: [[]],
      unit: ['piece'],
      unit_price: [0, [Validators.required, Validators.min(0)]],
      tax_model: ['include'],
      tax: [0, Validators.min(0)],
      discount_type: ['percent'],
      discount: [0, Validators.min(0)],
      min_qty: [1, [Validators.required, Validators.min(1)]],
      current_stock: [0, Validators.min(0)],
      description: ['']
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
      }
    });
  }

  onCategoryChange(): void {
    const catId = this.form.get('category_id')?.value;
    const selected = this.categories.find(cat => cat._id === catId);
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
      }
    });
  }

  onSinglePhotoSelected(event: Event, index: number): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('type', 'product');
    formData.append('file', file);

    this.isPhotosUploading = true;
    this.http.post<{ file: string }>(this.uploadUrl, formData).subscribe({
      next: (res) => {
        const url = res.file.replace(/\\/g, '/');
        this.photoPreviews.push(url);
        const images = this.form.get('images')?.value || [];
        this.form.patchValue({ images: [...images, url] });

        if (index === this.photoInputs.length - 1) {
          this.photoInputs.push(this.photoInputs.length);
        }

        this.isPhotosUploading = false;
      },
      error: (err) => {
        console.error('Photo upload error:', err);
        this.isPhotosUploading = false;
      }
    });
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
      console.warn('Upload or submission in progress.');
      return;
    }

    const name = this.form.get('name')?.value || '';
    if (!this.form.get('slug')?.value) {
      this.form.patchValue({ slug: this.generateSlug(name) });
    }

    this.isSubmitting = true;

    this.productService.createProduct(this.form.value).subscribe({
      next: (res) => {
        console.log('Product created:', res);
        this.router.navigate(['/products']);
      },
      error: (err) => {
        console.error('Product creation error:', err);
        this.isSubmitting = false;
      }
    });
  }

  removeThumbnail(): void {
    this.imagePreview = null;
    this.form.patchValue({ thumbnail: '' });
  }

  removePhoto(index: number): void {
    this.photoPreviews.splice(index, 1);
    const updatedImages = this.form.get('images')?.value.filter((_: string, i: number) => i !== index);
    this.form.patchValue({ images: updatedImages });
  }
}
