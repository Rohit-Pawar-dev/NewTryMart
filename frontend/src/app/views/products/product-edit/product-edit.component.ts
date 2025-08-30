import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { ProductService, Category, SubCategory } from '../../../services/product.service';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import Swal from 'sweetalert2';
import { firstValueFrom } from 'rxjs';
import { AttributeService } from '../../../services/attribute.service';
@Component({
  standalone: true,
  selector: 'app-product-edit',
  templateUrl: './product-edit.component.html',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, CKEditorModule],
})
export class ProductEditComponent implements OnInit {
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
  existingImages: string[] = [];
  photoPreviews: string[] = [];
  categories: Category[] = [];
  subcategories: SubCategory[] = [];
  sellers: any[] = [];
  openDropdown: string | null = null;
  productId!: string;
  mediaUrl = environment.mediaUrl;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private attributeService: AttributeService,
    private route: ActivatedRoute,
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
      is_variant: [false],
      variants: this.fb.array([]),
      variation_options: this.fb.array([]),
    });
  }

  ngOnInit(): void {
    this.productId = this.route.snapshot.paramMap.get('id')!;
    this.loadInitialData();
    this.loadProduct();
    document.addEventListener('click', this.handleClickOutside.bind(this));
  }

  loadInitialData(): void {
    this.productService.getAllCategories().subscribe(res => this.categories = res.data);
    this.http.get<{ data: any[] }>(`${environment.apiUrl}/seller`).subscribe(res => this.sellers = res.data);
    for (const type of this.variantTypes) {
      this.attributeService.getAttributesByType(type).subscribe(res => {
        this.variantOptions[type] = res.data.map((a: any) => a.value);
      });
    }
  }

  loadProduct(): void {
  this.productService.getProductById(this.productId).subscribe((product: any) => {

    let categoryId: string = '';
    if (product.category_id) {
      categoryId = typeof product.category_id === 'string'
        ? product.category_id
        : product.category_id._id;
    }
    let subCategoryId: string = '';
    if (product.sub_category_id) {
      subCategoryId = typeof product.sub_category_id === 'string'
        ? product.sub_category_id
        : product.sub_category_id._id;
    }
    this.form.patchValue({
      name: product.name,
      slug: product.slug,
      seller_id: product.seller_id,
      added_by: product.added_by,
      category_id: categoryId,
      sub_category_id: subCategoryId,
      thumbnail: product.thumbnail,
      images: product.images || [],
      unit: product.unit,
      unit_price: product.unit_price,
      tax: product.tax,
      discount_type: product.discount_type,
      discount: product.discount,
      min_qty: product.min_qty,
      current_stock: product.current_stock,
      description: product.description,
      is_variant: Array.isArray(product.variation_options) && product.variation_options.length > 0,
    });

    this.existingImages = product.images || [];
    this.photoPreviews = [...this.existingImages];
    this.imagePreview = product.thumbnail || null;
    const cat = this.categories.find(c => c._id === categoryId);
    this.subcategories = cat?.sub_categories || [];
    if (product.variation_options?.length) {
      this.isVariant = true;
      this.setExistingVariants(product.variation_options);
    }
  });
}

  setExistingVariants(options: any[]): void {
    const array = this.form.get('variation_options') as FormArray;
    array.clear();
    options.forEach(opt => {
      array.push(this.fb.group({
        variant_values: [opt.variant_values],
        price: [opt.price, [Validators.required, Validators.min(0)]],
        stock: [opt.stock, [Validators.required, Validators.min(0)]],
        sku: [opt.sku],
        images: [opt.images || []],
      }));
    });
  }

  handleClickOutside(event: Event): void {
    if (!(event.target as HTMLElement).closest('.position-relative')) {
      this.openDropdown = null;
    }
  }
  onCategoryChange(): void {
    const catId = this.form.value.category_id;
    const cat = this.categories.find(c => c._id === catId);
    this.subcategories = cat?.sub_categories || [];
    this.form.patchValue({ sub_category_id: '' });
  }

  onToggleVariant(event: Event): void {
    this.isVariant = (event.target as HTMLInputElement).checked;
    this.form.patchValue({ is_variant: this.isVariant });

    if (!this.isVariant) {
      this.selectedVariants = {};
      this.form.setControl('variants', this.fb.array([]));
      this.setExistingVariants([]);
    }
  }

  toggleVariantValue(event: Event, type: string, value: string): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (!this.selectedVariants[type]) this.selectedVariants[type] = [];
    if (checked) this.selectedVariants[type].push(value);
    else this.selectedVariants[type] = this.selectedVariants[type].filter(v => v !== value);
    this.buildVariantsFromSelectedAttributes();
  }

  buildVariantsFromSelectedAttributes(): void {
    const selected = Object.entries(this.selectedVariants)
      .filter(([_, vals]) => vals.length)
      .map(([k, v]) => ({ name: k, values: v }));

    this.form.setControl('variants', this.fb.array(selected.map(attr =>
      this.fb.group({
        name: [attr.name],
        values: [attr.values],
      })
    )));

    const combinations = this.cartesianProduct(selected);
    const varArray = this.form.get('variation_options') as FormArray;
    varArray.clear();

    combinations.forEach(combo => {
      varArray.push(this.fb.group({
        variant_values: [combo],
        price: [0, [Validators.required, Validators.min(0)]],
        stock: [0, [Validators.required, Validators.min(0)]],
        sku: [''],
        images: [[]],
      }));
    });
  }

  cartesianProduct(arr: any[]): any[] {
    if (!arr.length) return [];
    const recurse = (i = 0, prefix: any = {}) => {
      const results: any[] = [];
      arr[i].values.forEach((val: string) => {
        const next = { ...prefix, [arr[i].name]: val };
        if (i === arr.length - 1) results.push(next);
        else results.push(...recurse(i + 1, next));
      });
      return results;
    };
    return recurse();
  }

  removePhoto(i: number): void {
    if (i < this.existingImages.length) {
      this.existingImages.splice(i, 1);
    } else {

      const newImageIndex = i - this.existingImages.length;
      this.multiplePhotoFiles.splice(newImageIndex, 1);
    }
    this.photoPreviews.splice(i, 1);
  }

  onVariantImages(event: Event, index: number): void {
    const files = (event.target as HTMLInputElement).files;
    if (!files) return;
    if (!this.variantImageFiles[index]) this.variantImageFiles[index] = [];
    Array.from(files).forEach(f => this.variantImageFiles[index].push(f));
    const control = (this.form.get('variation_options') as FormArray).at(index).get('images');
    Array.from(files).forEach(f => {
      const reader = new FileReader();
      reader.onload = () => control?.patchValue([...control.value, reader.result]);
      reader.readAsDataURL(f);
    });
  }

  removeVariantImage(i: number, imgIdx: number): void {
    this.variantImageFiles[i]?.splice(imgIdx, 1);
    const control = (this.form.get('variation_options') as FormArray).at(i).get('images');
    const imgs = control?.value || [];
    imgs.splice(imgIdx, 1);
    control?.patchValue(imgs);
  }

  removeVariant(i: number): void {
    (this.form.get('variation_options') as FormArray).removeAt(i);
    delete this.variantImageFiles[i];
  }

  get variationOptions(): FormArray {
    return this.form.get('variation_options') as FormArray;
  }

  get variationControls() {
    return this.variationOptions.controls;
  }

  formatVariantValues(vals: any): string {
    return Object.entries(vals).map(([k, v]) => `${k}: ${v}`).join(', ');
  }

  generateSlug(val = ''): string {
    return val.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
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

  async onSubmit(): Promise<void> {
    if (!this.form.get('slug')?.value) this.form.patchValue({ slug: this.generateSlug(this.form.value.name) });
    Swal.fire({
      title: 'Confirm Save',
      text: 'Update this product?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, update',
    }).then(async res => {
      if (!res.isConfirmed) return;
      this.isSubmitting = true;

      try {
        if (this.thumbnailFile) {
          const thumbUrl = await this.uploadFile(this.thumbnailFile, 'thumbnail');
          this.form.patchValue({ thumbnail: thumbUrl });
          this.imagePreview = thumbUrl;
        }
        let uploadedImageUrls: string[] = [];
        if (this.multiplePhotoFiles.length) {
          uploadedImageUrls = await Promise.all(
            this.multiplePhotoFiles.map(f => this.uploadFile(f, 'image'))
          );
        }
        const allImages = [...this.existingImages, ...uploadedImageUrls];
        this.form.patchValue({ images: allImages });
        this.photoPreviews = allImages;

        for (let i = 0; i < this.variationOptions.length; i++) {
          const files = this.variantImageFiles[i] || [];
          if (files.length) {
            const urls = await Promise.all(files.map(f => this.uploadFile(f, 'variant')));
            const control = this.variationOptions.at(i);
            control.patchValue({ images: [...control.value.images.filter((img: string) => !img.startsWith('data:')), ...urls] });
          }
        }

        const val = { ...this.form.value, sub_category_id: this.form.value.sub_category_id || null };
        this.productService.updateProduct(this.productId, val).subscribe({
          next: () => Swal.fire('Updated!', 'Product updated successfully', 'success').then(() => this.router.navigate(['/admin/products'])),
          error: err => { this.isSubmitting = false; Swal.fire('Error', 'Update failed', 'error'); console.error(err); }
        });
      } catch (err) {
        this.isSubmitting = false;
        Swal.fire('Upload failed', 'Could not upload images', 'error');
        console.error(err);
      }
    });
  }
  onAddedByChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    if (value === 'admin') {
      this.form.patchValue({ seller_id: 'admin' });
    } else {
      this.form.patchValue({ seller_id: null });
    }
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


  toggleDropdown(type: string) {
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

}
