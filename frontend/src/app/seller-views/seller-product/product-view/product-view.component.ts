import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService, Product } from '../../../services/product.service';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../environments/environment';
@Component({
  selector: 'app-product-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-view.component.html',
  //   styleUrls: ['./product-view.component.css']
})
export class ProductViewComponent implements OnInit {
  objectKeys = Object.keys;
  product: Product | null = null;
  categoryName: string = 'N/A';
  subcategoryName: string = 'N/A';
  mediaUrl = environment.mediaUrl;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private router: Router
  ) { }

  ngOnInit(): void {
    const productId = this.route.snapshot.paramMap.get('id');
    if (productId) {
      this.getProductDetails(productId);
    }
  }

  // getProductDetails(id: string): void {
  //   this.productService.getProductById(id).subscribe({
  //     next: (res) => {
  //       this.product = res;

  //       // Check if category_id is actually an object and extract name
  //       const cat = (res as any).category_id;
  //       if (cat && typeof cat === 'object' && 'name' in cat) {
  //         this.categoryName = cat.name;
  //       }
  //     },
  //     error: (err) => {
  //       console.error('Failed to load product:', err);
  //     },
  //   });
  // }
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
          res.images = res.images.map(img =>
            this.isAbsoluteUrl(img) ? img : this.mediaUrl + img
          );
        }

        // Add full URL to variation option images
        if (res.variation_options) {
          res.variation_options = res.variation_options.map(option => ({
            ...option,
            images: option.images.map(img =>
              this.isAbsoluteUrl(img) ? img : this.mediaUrl + img
            )
          }));
        }

        // Optionally update category image if it's an object
        const cat = res.category_id as any;
        if (cat && typeof cat === 'object') {
          if (cat.image && !this.isAbsoluteUrl(cat.image)) {
            cat.image = this.mediaUrl + cat.image;
          }
          this.categoryName = cat.name || 'N/A';
        }

        // Optionally update sub-category image if it's an object
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
    this.router.navigate(['/seller/products']);
  }
}
