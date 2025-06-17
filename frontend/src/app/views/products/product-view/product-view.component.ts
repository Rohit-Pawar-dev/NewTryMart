import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService, Product } from '../../../services/product.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-view.component.html',
//   styleUrls: ['./product-view.component.css']
})
export class ProductViewComponent implements OnInit {
  product: Product | null = null;
  categoryName: string = 'N/A';

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const productId = this.route.snapshot.paramMap.get('id');
    if (productId) {
      this.getProductDetails(productId);
    }
  }

  getProductDetails(id: string): void {
    this.productService.getProductById(id).subscribe({
      next: (res) => {
        this.product = res;

        // Check if category_id is actually an object and extract name
        const cat = (res as any).category_id;
        if (cat && typeof cat === 'object' && 'name' in cat) {
          this.categoryName = cat.name;
        }
      },
      error: (err) => {
        console.error('Failed to load product:', err);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/products']);
  }
}
