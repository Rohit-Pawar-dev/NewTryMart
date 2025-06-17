import { Component, OnInit } from '@angular/core';
import { ProductService, Product } from '../../../services/product.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  searchTerm = '';
  isLoading = false;

  constructor(private productService: ProductService, private router: Router) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.isLoading = true;
    this.productService.getAllProducts({ search: this.searchTerm }).subscribe({
      next: (res) => {
        this.products = Array.isArray(res) ? res : res.data || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading products:', err);
        this.isLoading = false;
      },
    });
  }

  onSearchChange(): void {
    this.loadProducts();
  }

  editProduct(id: string): void {
    this.router.navigate(['/products/edit', id]);
  }

  

  deleteProduct(id: string): void {
    if (confirm('Are you sure you want to delete this product?')) {
      this.productService.deleteProduct(id).subscribe(() => {
        this.loadProducts();
      });
    }
  }

  toggleStatus(product: Product): void {
    const newStatus = product.status === 1 ? 0 : 1;
    this.productService
      .updateProduct(product._id!, { status: newStatus })
      .subscribe(() => this.loadProducts());
  }
}
