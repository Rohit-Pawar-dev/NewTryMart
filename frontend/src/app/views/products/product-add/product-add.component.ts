import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormArray,
} from '@angular/forms';
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
import { firstValueFrom } from 'rxjs';

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

  // Hold files locally until submit
  thumbnailFile: File | null = null;
  multiplePhotoFiles: File[] = [];
  variantImageFiles: { [variantIndex: number]: File[] } = {};

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
      added_by: ['admin'],
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
      variants: this.fb.array([]),
      variation_options: this.fb.array([]),
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

  // When thumbnail selected, just keep file and preview it locally, no upload
  onImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.thumbnailFile = file;

    // Preview locally using FileReader
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  // When multiple photos selected, just keep files and preview locally
  onMultiplePhotosSelected(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    this.multiplePhotoFiles.push(...newFiles);

    // Preview images locally using FileReader
    for (const file of newFiles) {
      const reader = new FileReader();
      reader.onload = () => {
        this.photoPreviews.push(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  removeThumbnail(): void {
    this.thumbnailFile = null;
    this.imagePreview = null;
    this.form.patchValue({ thumbnail: '' });
  }

  removePhoto(index: number): void {
    this.multiplePhotoFiles.splice(index, 1);
    this.photoPreviews.splice(index, 1);
    // Also update form images array on submit, no patch here yet
  }

  get variants(): FormArray {
    return this.form.get('variants') as FormArray;
  }

  get variationOptions(): FormArray {
    return this.form.get('variation_options') as FormArray;
  }

  get variationOptionsControls() {
    return this.variationOptions.controls;
  }

  addVariant(): void {
    this.variants.push(
      this.fb.group({
        name: ['', Validators.required],
        values: ['', Validators.required],
      })
    );
  }

  removeVariant(index: number): void {
    this.variants.removeAt(index);
    this.generateVariantOptions(); // Regenerate combinations
  }

  generateVariantOptions(): void {
    this.variationOptions.clear();

    const variants = this.variants.value.map((v: any) => ({
      name: v.name.trim(),
      values: v.values
        .split(',')
        .map((val: string) => val.trim())
        .filter((val: string) => val),
    }));

    const combinations = this.cartesianProduct(variants);

    combinations.forEach((combo) => {
      this.variationOptions.push(
        this.fb.group({
          variant_values: [combo],
          price: [0, Validators.min(0)],
          stock: [0, Validators.min(0)],
          sku: [''],
          images: [[]], // multiple images per variant option
        })
      );
    });

    // Reset variant image files map since variants changed
    this.variantImageFiles = {};
  }

  cartesianProduct(variants: any[]): { [key: string]: string }[] {
    if (variants.length === 0) return [];

    const recursive = (
      depth: number,
      prefix: { [key: string]: string }
    ): { [key: string]: string }[] => {
      const result: { [key: string]: string }[] = [];
      const variant = variants[depth];

      for (const val of variant.values) {
        const newPrefix = { ...prefix, [variant.name]: val };
        if (depth === variants.length - 1) {
          result.push(newPrefix);
        } else {
          result.push(...recursive(depth + 1, newPrefix));
        }
      }
      return result;
    };

    return recursive(0, {});
  }

  get variantsControls() {
    return (this.form.get('variants') as FormArray).controls;
  }

  formatVariantValues(values: { [key: string]: string }): string {
    return Object.entries(values)
      .map(([key, val]) => `${key}: ${val}`)
      .join(', ');
  }

  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-]/g, '');
  }

  prepareVariants(): void {
    const rawVariants = this.variants.value;
    const parsedVariants = rawVariants.map((v: any) => {
      let valuesArray: string[] = [];

      if (typeof v.values === 'string') {
        valuesArray = v.values.split(',').map((val: string) => val.trim());
      } else if (Array.isArray(v.values)) {
        valuesArray = v.values.map((val: string) => val.trim());
      } else {
        valuesArray = [];
      }

      return {
        name: v.name,
        values: valuesArray,
      };
    });
    this.form.patchValue({ variants: parsedVariants });
  }

  // New method to handle variant images selected but only store files locally
  onVariantImagesSelected(event: Event, variantIndex: number): void {
    const files = (event.target as HTMLInputElement).files;
    if (!files || files.length === 0) return;

    if (!this.variantImageFiles[variantIndex]) {
      this.variantImageFiles[variantIndex] = [];
    }
    this.variantImageFiles[variantIndex].push(...Array.from(files));

    // For preview, optionally convert to base64 here and store in form control images for UI
    const variantGroup = this.variationOptions.at(variantIndex);
    const currentPreviews: string[] = variantGroup.get('images')?.value || [];

    for (const file of Array.from(files)) {
      const reader = new FileReader();
      reader.onload = () => {
        variantGroup.patchValue({ images: [...currentPreviews, reader.result as string] });
      };
      reader.readAsDataURL(file);
    }
  }

  removeVariantImage(variantIndex: number, imageIndex: number): void {
    // Remove from local files if possible, else just remove preview
    if (this.variantImageFiles[variantIndex]) {
      this.variantImageFiles[variantIndex].splice(imageIndex, 1);
    }
    const variantGroup = this.variationOptions.at(variantIndex);
    const images: string[] = variantGroup.get('images')?.value || [];
    images.splice(imageIndex, 1);
    variantGroup.patchValue({ images });
  }

  async uploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('type', 'product');
    formData.append('file', file);

    const res = await firstValueFrom(this.http.post<{ file: string }>(this.uploadUrl, formData));

    if (!res || !res.file) {
      throw new Error('Upload failed: No file returned');
    }

    return res.file.replace(/\\/g, '/');
  }

  async submit(): Promise<void> {
    if (this.isSubmitting) {
      Swal.fire('Please wait', 'Submission in progress.', 'info');
      return;
    }

    const name = this.form.get('name')?.value || '';
    if (!this.form.get('slug')?.value) {
      this.form.patchValue({ slug: this.generateSlug(name) });
    }

    this.prepareVariants();

    Swal.fire({
      title: 'Confirm Product Creation',
      text: 'Are you sure you want to create this product?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, create it',
      cancelButtonText: 'Cancel',
    }).then(async (result) => {
      if (!result.isConfirmed) {
        return;
      }

      this.isSubmitting = true;

      try {
        // Upload thumbnail if exists
        if (this.thumbnailFile) {
          const thumbUrl = await this.uploadFile(this.thumbnailFile);
          this.form.patchValue({ thumbnail: thumbUrl });
        } else {
          // Validate thumbnail required
          Swal.fire('Error', 'Thumbnail is required.', 'error');
          this.isSubmitting = false;
          return;
        }

        // Upload multiple photos
        if (this.multiplePhotoFiles.length > 0) {
          const photoUrls = await Promise.all(this.multiplePhotoFiles.map((file) => this.uploadFile(file)));
          this.form.patchValue({ images: photoUrls });
        } else {
          this.form.patchValue({ images: [] });
        }

        // Upload variant images
        for (let i = 0; i < this.variationOptions.length; i++) {
          const files = this.variantImageFiles[i] || [];
          if (files.length > 0) {
            const urls = await Promise.all(files.map((file) => this.uploadFile(file)));

            const variantGroup = this.variationOptions.at(i);
            const existingImages: string[] = variantGroup.get('images')?.value || [];

            variantGroup.patchValue({ images: [...existingImages.filter(img => !img.startsWith('data:')), ...urls] });
          }
        }

        // Set added_by
        this.form.patchValue({ added_by: 'admin' });

        // Handle sub_category_id = '' => null
        const formValue = { ...this.form.value };
        if (formValue.sub_category_id === '') {
          formValue.sub_category_id = null;
        }

        // Now send form data to create product
        this.productService.createProduct(formValue).subscribe({
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
            Swal.fire('Creation Failed', 'Failed to create product. Please try again.', 'error');
          },
        });
      } catch (error) {
        console.error('Upload error:', error);
        this.isSubmitting = false;
        Swal.fire('Upload Failed', 'Failed to upload images.', 'error');
      }
    });
  }
}

