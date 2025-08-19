import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService, Product } from '../../../services/product.service';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../environments/environment';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-seller-product-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seller-product-view.component.html',
})
export class SellerProductViewComponent implements OnInit {
  objectKeys = Object.keys;
  product: Product | null = null;
  categoryName: string = 'N/A';
  subcategoryName: string = 'N/A';
  mediaUrl = environment.mediaUrl;
  productId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private router: Router
  ) { }

  ngOnInit(): void {
    const productId = this.route.snapshot.paramMap.get('id');
    this.productId = productId;
    if (productId) {
      this.getProductDetails(productId);
    }
  }

  private isAbsoluteUrl(url: string): boolean {
    return /^https?:\/\//i.test(url);
  }

  getProductDetails(id: string): void {
    this.productService.getProductById(id).subscribe({
      next: (res) => {
        // Add full URL to thumbnail
        if (res.thumbnail && !this.isAbsoluteUrl(res.thumbnail)) {
          res.thumbnail = this.mediaUrl + res.thumbnail;
        }

        // Add full URL to product images
        if (res.images && Array.isArray(res.images)) {
          res.images = res.images.map((img) =>
            this.isAbsoluteUrl(img) ? img : this.mediaUrl + img
          );
        }

        // Add full URL to variation option images
        if (res.variation_options) {
          res.variation_options = res.variation_options.map((option) => ({
            ...option,
            images: option.images.map((img) =>
              this.isAbsoluteUrl(img) ? img : this.mediaUrl + img
            ),
          }));
        }

        // Update category info
        const cat = res.category_id as any;
        if (cat && typeof cat === 'object') {
          if (cat.image && !this.isAbsoluteUrl(cat.image)) {
            cat.image = this.mediaUrl + cat.image;
          }
          this.categoryName = cat.name || 'N/A';
        }

        // Update sub-category info
        const subCat = res.sub_category_id as any;
        if (subCat && typeof subCat === 'object' && subCat.image) {
          if (!this.isAbsoluteUrl(subCat.image)) {
            subCat.image = this.mediaUrl + subCat.image;
            this.subcategoryName = subCat.name;
          }
        }

        this.product = res;
      },
      error: (err) => {
        console.error('Failed to load product:', err);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/seller-products']);
  }

  changeStatus(status: 1 | 2): void {
    if (!this.product?._id) return;

    this.productService.changeRequestStatus(this.product._id, status).subscribe({
      next: (updated) => {
        Swal.fire({
          icon: 'success',
          title:
            status === 1
              ? 'Product Approved!'
              : 'Product Denied!',
          timer: 1500,
          showConfirmButton: false,
        });
        this.product = updated;
        this.getProductDetails(this.productId!);
      },
      error: (err) => {
        console.error('Status update failed:', err);
        Swal.fire('Error', 'Failed to update product status', 'error');
      },
    });
  }
}
