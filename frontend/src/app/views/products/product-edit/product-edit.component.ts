import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import {
  ProductService,
  Category,
  SubCategory,
  Product,
} from '../../../services/product.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-product-edit',
  standalone: true,
  templateUrl: './product-edit.component.html',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
})
export class ProductEditComponent implements OnInit {
  form: FormGroup;
  productId: string = '';
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
    private route: ActivatedRoute,
    private productService: ProductService,
    private http: HttpClient,
    private router: Router
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
      unit_price: [0, Validators.required],
      tax_model: ['include'],
      tax: [0],
      discount_type: ['percent'],
      discount: [0],
      min_qty: [1],
      current_stock: [0],
      description: [''],
      status: [1, Validators.required],
      added_by: ['admin'],
    });

    this.form.get('name')?.valueChanges.subscribe((name) => {
      if (!this.form.get('slug')?.value) {
        this.form.patchValue({ slug: this.generateSlug(name) }, { emitEvent: false });
      }
    });
  }

  ngOnInit(): void {
    this.productId = this.route.snapshot.params['id'];
    this.loadCategories();
    this.loadProduct();
  }

  loadProduct(): void {
    this.productService.getProductById(this.productId).subscribe({
      next: (product: Product) => {
        this.form.patchValue(product);

        if (product.category_id) {
          this.onCategoryChange();
          this.form.patchValue({ sub_category_id: product.sub_category_id || '' });
        }

        this.imagePreview = product.thumbnail;
        this.photoPreviews = product.images || [];
        this.form.patchValue({ images: product.images || [] });
      },
      error: (err) => {
        console.error('Failed to load product', err);
        Swal.fire('Error', 'Could not load product details', 'error');
      },
    });
  }

  loadCategories(): void {
    this.productService.getAllCategories().subscribe({
      next: (res) => (this.categories = res.data),
      error: (err) => console.error('Error loading categories:', err),
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
    this.uploadError = null;

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
        Swal.fire('Upload Failed', 'Failed to upload thumbnail. Please try again.', 'error');
      },
    });
  }

  onCancel() {
    this.router.navigate(['/products']);
  }

  disableScroll(event: WheelEvent): void {
    event.preventDefault();
  }

  disableArrowKeys(event: KeyboardEvent): void {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
    }
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
        Swal.fire('Upload Failed', 'Failed to upload photo. Please try again.', 'error');
      },
    });
  }

  removePhoto(index: number): void {
    if (index < 0 || index >= this.photoPreviews.length) return;

    this.photoPreviews.splice(index, 1);
    this.form.patchValue({ images: this.photoPreviews });

    if (this.photoInputs.length > this.photoPreviews.length + 1) {
      this.photoInputs.pop();
    }
  }

  removeAllPhotos(): void {
    this.photoPreviews = [];
    this.photoInputs = [0];
    this.form.patchValue({ images: [] });
  }

  removeThumbnail(): void {
    this.imagePreview = null;
    this.form.patchValue({ thumbnail: '' });
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-]/g, '');
  }

  private cleanObjectIdFields(data: any): any {
    const cleaned = { ...data };
    if (cleaned.sub_category_id === '') cleaned.sub_category_id = null;
    if (cleaned.category_id === '') cleaned.category_id = null;
    if (cleaned.seller_id === '') cleaned.seller_id = null;
    return cleaned;
  }

  submit(): void {
    if (this.isSubmitting || this.isUploading || this.isPhotosUploading) {
      Swal.fire('Please wait', 'Upload or submission in progress.', 'info');
      return;
    }

    if (this.form.invalid) {
      Swal.fire('Invalid', 'Please fill in all required fields correctly.', 'warning');
      return;
    }

    const name = this.form.get('name')?.value || '';
    if (!this.form.get('slug')?.value) {
      this.form.patchValue({ slug: this.generateSlug(name) });
    }

    let formData = { ...this.form.value };
    formData = this.cleanObjectIdFields(formData);

    Swal.fire({
      title: 'Confirm Product Update',
      text: 'Are you sure you want to update this product?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, update it',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        this.executeSubmit(formData);
      }
    });
  }

  private executeSubmit(formData: any): void {
    this.isSubmitting = true;

    this.productService.updateProduct(this.productId, formData).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        Swal.fire({
          icon: 'success',
          title: 'Product Updated',
          text: 'The product has been successfully updated.',
          confirmButtonText: 'OK',
          confirmButtonColor: '#3085d6',
        }).then(() => {
          this.router.navigate(['/products']);
        });
      },
      error: (err) => {
        console.error('Product update error:', err);
        this.isSubmitting = false;
        Swal.fire('Update Failed', 'Failed to update product. Please try again.', 'error');
      },
    });
  }
}
