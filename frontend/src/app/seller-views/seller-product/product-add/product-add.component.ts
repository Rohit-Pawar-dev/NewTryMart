import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { SellerAuthService } from '../../../services/sellerAuth.service';
import {
  ProductService,
  Category,
  SubCategory,
} from '../../../services/product.service';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import Swal from 'sweetalert2';
import { firstValueFrom } from 'rxjs';
import { AttributeService } from '../../../services/attribute.service';

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

  isVariant = false;
  variantTypes: ('color' | 'size')[] = ['color', 'size'];
  variantOptions: { [key: string]: string[] } = {};
  selectedVariants: { [key: string]: string[] } = {};

  thumbnailFile: File | null = null;
  multiplePhotoFiles: File[] = [];
  variantImageFiles: { [variantIndex: number]: File[] } = {};

  imagePreview: string | null = null;
  photoPreviews: string[] = [];

  categories: Category[] = [];
  subcategories: SubCategory[] = [];

  // private uploadUrl = `${environment.apiUrl}/upload-media`;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private attributeService: AttributeService,
    private router: Router,
    private http: HttpClient,
    private sellerAuthService: SellerAuthService,
  ) {

    let sellerId = this.sellerAuthService.getSellerId();
    let sellerProfile = this.sellerAuthService.getSellerProfile();

    this.form = this.fb.group({
      name: ['', Validators.required],
      slug: [''],
      seller_id: [sellerId],
      added_by: ['seller'],
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
      is_variant: [false],
      variants: this.fb.array([]),
      variation_options: this.fb.array([]),
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadVariantAttributes();
    document.addEventListener('click', this.handleClickOutside.bind(this));
    document.removeEventListener('click', this.handleClickOutside.bind(this));
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

  handleClickOutside(event: Event): void {
    const target = event.target as HTMLElement;
    const clickedInside = target.closest('.position-relative');
    if (!clickedInside) {
      this.openDropdown = null;
    }
  }

  loadVariantAttributes(): void {
    for (const type of this.variantTypes) {
      this.attributeService.getAttributesByType(type).subscribe({
        next: (res) => {
          this.variantOptions[type] = res.data.map((attr) => attr.value);
        },
        error: () => {
          console.error(`Failed to load ${type} attributes`);
        },
      });
    }
  }

  onToggleVariant(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.isVariant = input.checked;

    if (!this.isVariant) {
      this.selectedVariants = {};
      this.variationOptions.clear();
      this.form.patchValue({ variants: [], is_variant: false });
    } else {
      this.form.patchValue({ is_variant: true });
    }
  }
  toggleVariantValue(event: Event, type: string, value: string): void {
    const inputElement = event.target as HTMLInputElement;
    const checked = inputElement.checked;

    if (!this.selectedVariants[type]) {
      this.selectedVariants[type] = [];
    }

    if (checked) {
      if (!this.selectedVariants[type].includes(value)) {
        this.selectedVariants[type].push(value);
      }
    } else {
      this.selectedVariants[type] = this.selectedVariants[type].filter(
        (v) => v !== value
      );
    }

    this.buildVariantsFromSelectedAttributes();
  }

  openDropdown: string | null = null;

  toggleDropdown(type: string): void {
    this.openDropdown = this.openDropdown === type ? null : type;
  }

  onCheckboxChange(event: Event, type: string, value: string): void {
    const input = event.target as HTMLInputElement;
    const checked = input.checked;

    if (!this.selectedVariants[type]) {
      this.selectedVariants[type] = [];
    }

    if (checked) {
      if (!this.selectedVariants[type].includes(value)) {
        this.selectedVariants[type].push(value);
      }
    } else {
      this.selectedVariants[type] = this.selectedVariants[type].filter(
        (v) => v !== value
      );
    }

    this.buildVariantsFromSelectedAttributes();
  }

  buildVariantsFromSelectedAttributes(): void {
    const selected = Object.entries(this.selectedVariants)
      .filter(([_, values]) => values.length > 0)
      .map(([type, values]) => ({ name: type, values }));

    const combinations = this.cartesianProduct(selected);
    this.variationOptions.clear();

    combinations.forEach((combo) => {
      const variantGroup = this.fb.group({
        variant_values: [combo],
        price: [0, [Validators.required, Validators.min(0)]],
        stock: [0, [Validators.required, Validators.min(0)]],
        sku: [''],
        images: this.fb.control([]),
      });

      this.variationOptions.push(variantGroup);
    });

    this.form.patchValue({ variants: selected });
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

  onVariantImagesSelected(event: Event, index: number): void {
    const files = (event.target as HTMLInputElement).files;
    if (!files || files.length === 0) return;

    if (!this.variantImageFiles[index]) {
      this.variantImageFiles[index] = [];
    }

    this.variantImageFiles[index].push(...Array.from(files));

    const optionGroup = this.variationOptions.at(index);
    const previews: string[] = optionGroup.get('images')?.value || [];

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const newImage = reader.result as string;
        optionGroup.patchValue({ images: [...previews, newImage] });
      };
      reader.readAsDataURL(file);
    });
  }

  removeVariantImage(index: number, imgIndex: number): void {
    if (this.variantImageFiles[index]) {
      this.variantImageFiles[index].splice(imgIndex, 1);
    }

    const optionGroup = this.variationOptions.at(index);
    const images: string[] = optionGroup.get('images')?.value || [];

    images.splice(imgIndex, 1);
    optionGroup.patchValue({ images });
  }

  onMultiplePhotosSelected(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    this.multiplePhotoFiles.push(...newFiles);

    for (const file of newFiles) {
      const reader = new FileReader();
      reader.onload = () => {
        this.photoPreviews.push(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  removePhoto(index: number): void {
    this.multiplePhotoFiles.splice(index, 1);
    this.photoPreviews.splice(index, 1);
  }

  onImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.thumbnailFile = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  removeThumbnail(): void {
    this.thumbnailFile = null;
    this.imagePreview = null;
    this.form.patchValue({ thumbnail: '' });
  }

  get variationOptions(): FormArray {
    return this.form.get('variation_options') as FormArray;
  }

  get variationOptionsControls() {
    return this.variationOptions.controls;
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

  async uploadFile(file: File, type: 'thumbnail' | 'image' | 'variant'): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    let endpoint = '';
    if (type === 'thumbnail') {
      endpoint = `${environment.apiUrl}/products/upload-thumbnail`;
    } else if (type === 'image') {
      endpoint = `${environment.apiUrl}/products/upload-image`;
    } else if (type === 'variant') {
      endpoint = `${environment.apiUrl}/products/upload-variant-image`;
    }

    const res = await firstValueFrom(
      this.http.post<{ path: string }>(endpoint, formData)
    );

    if (!res || !res.path) {
      throw new Error('Upload failed: No path returned');
    }

    return res.path.replace(/\\/g, '/');
  }

  async submit(): Promise<void> {
    if (this.isSubmitting) {
      Swal.fire('Please wait', 'Submission in progress.', 'info');
      return;
    }

    if (!this.form.get('slug')?.value) {
      this.form.patchValue({
        slug: this.generateSlug(this.form.get('name')?.value || ''),
      });
    }

    this.form.patchValue({ is_variant: this.isVariant });

    const selected = Object.entries(this.selectedVariants)
      .filter(([_, values]) => values.length > 0)
      .map(([key, values]) => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        values,
      }));
    this.form.setControl(
      'variants',
      this.fb.array(
        selected.map((attr) =>
          this.fb.group({
            name: [attr.name],
            values: [attr.values],
          })
        )
      )
    );
    Swal.fire({
      title: 'Confirm Product Creation',
      text: 'Are you sure you want to create this product?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, create it',
      cancelButtonText: 'Cancel',
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      this.isSubmitting = true;

      try {
        if (this.thumbnailFile) {
          // const thumbUrl = await this.uploadFile(this.thumbnailFile);
          // this.form.patchValue({ thumbnail: thumbUrl });
          const thumbUrl = await this.uploadFile(this.thumbnailFile, 'thumbnail');
          this.form.patchValue({ thumbnail: thumbUrl });

        } else {
          Swal.fire('Error', 'Thumbnail is required.', 'error');
          this.isSubmitting = false;
          return;
        }

        if (this.multiplePhotoFiles.length > 0) {
          // const photoUrls = await Promise.all(
          //   this.multiplePhotoFiles.map((file) => this.uploadFile(file))
          // );
          //  this.form.patchValue({ images: photoUrls });
          const photoUrls = await Promise.all(
            this.multiplePhotoFiles.map((file) => this.uploadFile(file, 'image'))
          );
          this.form.patchValue({ images: photoUrls });


        } else {
          this.form.patchValue({ images: [] });
        }

        for (let i = 0; i < this.variationOptions.length; i++) {
          const files = this.variantImageFiles[i] || [];
          if (files.length > 0) {
            // const urls = await Promise.all(
            //   files.map((file) => this.uploadFile(file))
            // );
            const urls = await Promise.all(
              files.map((file) => this.uploadFile(file, 'variant'))
            );

            const variantGroup = this.variationOptions.at(i);
            const existingImages: string[] =
              variantGroup.get('images')?.value || [];
            variantGroup.patchValue({
              images: [
                ...existingImages.filter((img) => !img.startsWith('data:')),
                ...urls,
              ],
            });
          }
        }
        const formValue = { ...this.form.value };
        if (formValue.sub_category_id === '') {
          formValue.sub_category_id = null;
        }
        this.productService.createProductBySeller(formValue).subscribe({
          next: () => {
            Swal.fire(
              'Product Created',
              'The product has been successfully created.',
              'success'
            ).then(() => this.router.navigate(['/seller/products']));
          },
          error: (err) => {
            console.error('Product creation error:', err);
            this.isSubmitting = false;
            Swal.fire('Creation Failed', 'Failed to create product.', 'error');
          },
        });
      } catch (error) {
        console.error('Upload error:', error);
        this.isSubmitting = false;
        Swal.fire('Upload Failed', 'Failed to upload images.', 'error');
      }
    });
  }
  removeVariant(index: number): void {
    this.variationOptions.removeAt(index);
    delete this.variantImageFiles[index];
  }
}
