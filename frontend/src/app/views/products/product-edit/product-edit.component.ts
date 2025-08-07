import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
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
  variants: FormArray;
  variationOptions: FormArray;
  variantImageFiles: { [key: number]: File[] } = {};
  photoPreviews: string[] = [];
  imagePreview: string | null = null;
  categories: Category[] = [];
  subcategories: SubCategory[] = [];
  productId = '';
  isUploading = false;
  isPhotosUploading = false;
  isSubmitting = false;

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
      category_id: ['', Validators.required],
      sub_category_id: [''],
      thumbnail: ['', Validators.required],
      images: [[]],
      unit_price: [0, Validators.required],
      tax: [0],
      discount_type: ['percent'],
      discount: [0],
      min_qty: [1],
      current_stock: [0],
      description: [''],
      status: [1, Validators.required],
      variants: this.fb.array([]),
      variation_options: this.fb.array([]),
    });

    this.variants = this.form.get('variants') as FormArray;
    this.variationOptions = this.form.get('variation_options') as FormArray;

    this.form.get('name')?.valueChanges.subscribe((name) => {
      if (!this.form.get('slug')?.value) {
        this.form.patchValue({ slug: this.generateSlug(name) }, { emitEvent: false });
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
        this.categories = categories.data;
        this.patchBaseFields(product);
        this.loadVariants(product);
      },
      error: () => {
        Swal.fire('Error', 'Failed to load product data.', 'error');
      },
    });
  }

  private patchBaseFields(product: Product) {
    this.form.patchValue({
      ...product,
      images: product.images || [],
      thumbnail: product.thumbnail || '',
    });

    this.imagePreview = product.thumbnail || '';
    this.photoPreviews = product.images || [];

    const selectedCat = this.categories.find((c) => c._id === product.category_id);
    this.subcategories = selectedCat?.sub_categories || [];
    this.form.patchValue({
      category_id: product.category_id || '',
      sub_category_id: product.sub_category_id || '',
    });
  }

  private loadVariants(product: Product) {
    if (product.variants) {
      product.variants.forEach((v) => {
        this.variants.push(
          this.fb.group({
            name: [v.name, Validators.required],
            values: [v.values.join(','), Validators.required],
          })
        );
      });
      this.generateVariantOptions();
    }

    if (product.variation_options) {
      product.variation_options.forEach((opt, i) => {
        const group = this.variationOptions.at(i);
        group.patchValue({
          price: opt.price,
          stock: opt.stock,
          sku: opt.sku,
          images: opt.images || [],
        });
      });
    }
  }

  // onCategoryChange(): void {
  //   const cat = this.categories.find((c) => c._id === this.form.value.category_id);
  //   this.subcategories = cat?.sub_categories || [];
  //   this.form.patchValue({ sub_category_id: '' });
  // }
  onCategoryChange(): void {
  const cat = this.categories.find((c) => c._id === this.form.value.category_id);
  this.subcategories = cat?.sub_categories || [];
  this.form.patchValue({ sub_category_id: '' });

  console.log('Category changed to:', cat);
  console.log('Subcategories:', this.subcategories);
}


  onImageSelected(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const fd = new FormData();
    fd.append('type', 'product');
    fd.append('file', file);

    this.isUploading = true;
    this.http.post<{ file: string }>(this.uploadUrl, fd).subscribe({
      next: (res) => {
        const url = res.file.replace(/\\/g, '/');
        this.form.patchValue({ thumbnail: url });
        this.imagePreview = url;
        this.isUploading = false;
      },
      error: () => {
        this.isUploading = false;
        Swal.fire('Error', 'Thumbnail upload failed.', 'error');
      },
    });
  }

  onMultiplePhotosSelected(e: Event): void {
    const files = (e.target as HTMLInputElement).files;
    if (!files) return;

    this.isPhotosUploading = true;
    const uploadPromises = Array.from(files).map((f) => {
      const fd = new FormData();
      fd.append('type', 'product');
      fd.append('file', f);
      return this.http.post<{ file: string }>(this.uploadUrl, fd).toPromise();
    });

    Promise.all(uploadPromises)
      .then((responses) => {
        const urls = responses
          .filter((r): r is { file: string } => !!r && !!r.file)
          .map((r) => r.file.replace(/\\/g, '/'));

        this.photoPreviews.push(...urls);
        this.form.patchValue({ images: this.photoPreviews });
        this.isPhotosUploading = false;
      })
      .catch(() => {
        this.isPhotosUploading = false;
        Swal.fire('Error', 'Photo uploads failed.', 'error');
      });
  }

  removePhoto(i: number): void {
    this.photoPreviews.splice(i, 1);
    this.form.patchValue({ images: this.photoPreviews });
  }

  removeThumbnail(): void {
    this.imagePreview = null;
    this.form.patchValue({ thumbnail: '' });
  }

  addVariant(): void {
    this.variants.push(
      this.fb.group({
        name: ['', Validators.required],
        values: ['', Validators.required],
      })
    );
  }

  removeVariant(i: number): void {
    this.variants.removeAt(i);
    this.generateVariantOptions();
  }
  formatVariantValues(variantObj: { [key: string]: string }): string {
    if (!variantObj) return '';
    return Object.entries(variantObj)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  }

  onCancel(): void {
    this.router.navigate(['/admin/products']);
  }


  generateVariantOptions() {
    this.variationOptions.clear();
    const variants = this.variants.value.map((v: any) => {
      const values = Array.isArray(v.values)
        ? v.values
        : (typeof v.values === 'string'
          ? v.values.split(',').map((x: string) => x.trim()).filter((x: string) => x)
          : []);

      return { name: v.name.trim(), values };
    });

    const combos = this.cartesianProduct(variants);
    combos.forEach(combo => {
      this.variationOptions.push(this.fb.group({
        variant_values: [combo],
        price: [0, Validators.min(0)],
        stock: [0, Validators.min(0)],
        sku: [''],
        images: [[]],
      }));
    });
    this.variantImageFiles = {};
  }


  private cartesianProduct(arr: any[]): any[] {
    const recurse = (i: number, cur: any) => {
      return arr[i].values.flatMap((val: string) => {
        const next = { ...cur, [arr[i].name]: val };
        return i + 1 < arr.length ? recurse(i + 1, next) : [next];
      });
    };
    return recurse(0, {});
  }

  onVariantImagesSelected(e: Event, i: number): void {
    const files = (e.target as HTMLInputElement).files;
    if (!files) return;
    if (!this.variantImageFiles[i]) this.variantImageFiles[i] = [];
    this.variantImageFiles[i].push(...Array.from(files));

    const ctrl = this.variationOptions.at(i);
    const prev = ctrl.get('images')?.value || [];
    Array.from(files).forEach((f) => {
      const reader = new FileReader();
      reader.onload = () => {
        ctrl.patchValue({ images: [...prev, reader.result as string] });
      };
      reader.readAsDataURL(f);
    });
  }

  removeVariantImage(i: number, xi: number): void {
    this.variantImageFiles[i]?.splice(xi, 1);
    const ctrl = this.variationOptions.at(i);
    const imgs = ctrl.get('images')?.value;
    imgs.splice(xi, 1);
    ctrl.patchValue({ images: imgs });
  }
  private prepareVariantsForSubmit(): void {
    const vout = this.variants.value.map((v: any) => {
      let valuesArray: string[] = [];

      if (Array.isArray(v.values)) {
        valuesArray = v.values.map((x: any) => (typeof x === 'string' ? x.trim() : '')).filter(Boolean);
      } else if (typeof v.values === 'string') {
        valuesArray = v.values.split(',').map((x: string) => x.trim()).filter(Boolean);
      } else {
        valuesArray = [];
      }

      return {
        name: v.name.trim(),
        values: valuesArray,
      };
    });

    this.form.patchValue({ variants: vout });

    const opts = this.variationOptions.value.map((opt: any) => ({
      variant_values: opt.variant_values,
      price: opt.price,
      stock: opt.stock,
      sku: opt.sku,
      images: opt.images,
    }));

    this.form.patchValue({ variation_options: opts });
  }

  submit(): void {
    if (this.isUploading || this.isPhotosUploading || this.isSubmitting) {
      Swal.fire('Please wait', 'Uploads or submission still in progress.', 'info');
      return;
    }

    if (this.form.invalid) {
      Swal.fire('Invalid', 'Please fix form errors.', 'warning');
      return;
    }

    this.prepareVariantsForSubmit();

    Swal.fire({
      title: 'Update Product?',
      showCancelButton: true,
      confirmButtonText: 'Yes, update it',
    }).then((res) => {
      if (res.isConfirmed) this.sendUpdate();
    });
  }

  private sendUpdate(): void {
    const data = this.cleanIds(this.form.value);
    this.isSubmitting = true;

    this.productService.updateProduct(this.productId, data).subscribe({
      next: () => {
        this.isSubmitting = false;
        Swal.fire('Updated!', 'Product successfully updated.', 'success').then(() =>
          this.router.navigate(['/admin/products'])
        );
      },
      error: () => {
        this.isSubmitting = false;
        Swal.fire('Error', 'Update failed.', 'error');
      },
    });
  }

  private cleanIds(obj: any): any {
    const o = { ...obj };
    if (o.sub_category_id === '') o.sub_category_id = null;
    if (o.category_id === '') o.category_id = null;
    return o;
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-]/g, '');
  }
}
