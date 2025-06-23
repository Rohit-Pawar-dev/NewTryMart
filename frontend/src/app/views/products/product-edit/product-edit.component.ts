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
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import Swal from 'sweetalert2';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-product-edit',
  standalone: true,
  templateUrl: './product-edit.component.html',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, CKEditorModule],
})
export class ProductEditComponent implements OnInit {
  public Editor = ClassicEditor;

  form: FormGroup;
  productId: string = '';
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
        this.form.patchValue(
          { slug: this.generateSlug(name) },
          { emitEvent: false }
        );
      }
    });
  }

  ngOnInit(): void {
    this.productId = this.route.snapshot.params['id'];

    forkJoin({
      product: this.productService.getProductById(this.productId),
      categories: this.productService.getAllCategories(),
    }).subscribe({
      next: ({ product, categories }) => {
        // Set categories
        this.categories = categories.data;

        // --- Extract categoryId safely ---
        const categoryId: string =
          typeof product.category_id === 'string'
            ? product.category_id
            : (product.category_id as any)?._id;

        // --- Extract subCategoryId safely ---
        const subCategoryId: string =
          typeof product.sub_category_id === 'string'
            ? product.sub_category_id
            : (product.sub_category_id as any)?._id;

        // --- Patch base product fields ---
        this.form.patchValue({
          ...product,
          category_id: categoryId || '',
          sub_category_id: subCategoryId || '',
          images: product.images || [],
          thumbnail: product.thumbnail || '',
        });

        // --- Preview setup ---
        this.imagePreview = product.thumbnail || '';
        this.photoPreviews = product.images || [];

        // --- Load subcategories based on selected category ---
        const selectedCat = this.categories.find(
          (cat: Category) => cat._id === categoryId
        );
        this.subcategories = selectedCat?.sub_categories || [];
      },
      error: (err) => {
        console.error('Failed to load product or categories', err);
        Swal.fire('Error', 'Failed to load product or categories', 'error');
      },
    });
  }

  loadProduct(): void {
    this.productService.getProductById(this.productId).subscribe({
      next: (product: Product) => {
        this.form.patchValue(product);

        if (product.category_id) {
          this.onCategoryChange();
          this.form.patchValue({
            sub_category_id: product.sub_category_id || '',
          });
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
        const url = res?.file?.replace(/\\/g, '/');
        this.form.patchValue({ thumbnail: url });
        this.imagePreview = url;
        this.isUploading = false;
      },
      error: (err) => {
        console.error('Thumbnail upload error:', err);
        this.uploadError = 'Failed to upload thumbnail';
        this.isUploading = false;
        Swal.fire(
          'Upload Failed',
          'Failed to upload thumbnail. Please try again.',
          'error'
        );
      },
    });
  }

  onMultiplePhotosSelected(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (!files || files.length === 0) return;

    this.isPhotosUploading = true;
    const formDataArray: FormData[] = [];

    for (let i = 0; i < files.length; i++) {
      const formData = new FormData();
      formData.append('type', 'product');
      formData.append('file', files[i]);
      formDataArray.push(formData);
    }

    const uploadPromises = formDataArray.map((fd) =>
      this.http.post<{ file: string }>(this.uploadUrl, fd).toPromise()
    );

    Promise.all(uploadPromises)
      .then((responses) => {
        const urls = responses
          .map((res) => res?.file?.replace(/\\/g, '/'))
          .filter((url): url is string => !!url);
        this.photoPreviews.push(...urls);
        this.form.patchValue({
          images: [...(this.form.get('images')?.value || []), ...urls],
        });
        this.isPhotosUploading = false;
      })
      .catch((err) => {
        console.error('Photo upload error:', err);
        this.isPhotosUploading = false;
        Swal.fire(
          'Upload Failed',
          'Failed to upload one or more images. Please try again.',
          'error'
        );
      });
  }

  removePhoto(index: number): void {
    if (index < 0 || index >= this.photoPreviews.length) return;

    this.photoPreviews.splice(index, 1);
    this.form.patchValue({ images: [...this.photoPreviews] });
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
      Swal.fire(
        'Invalid',
        'Please fill in all required fields correctly.',
        'warning'
      );
      return;
    }

    const name = this.form.get('name')?.value || '';
    if (!this.form.get('slug')?.value) {
      this.form.patchValue({ slug: this.generateSlug(name) });
    }

    let formData = this.cleanObjectIdFields(this.form.value);

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
      next: () => {
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
        Swal.fire(
          'Update Failed',
          'Failed to update product. Please try again.',
          'error'
        );
      },
    });
  }

  onCancel() {
    this.router.navigate(['/products']);
  }
}
