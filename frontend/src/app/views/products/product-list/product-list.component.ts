import { Component, OnInit } from '@angular/core';
import { ProductService, Product } from '../../../services/product.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

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
        Swal.fire('Error', 'Failed to load products', 'error');
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
    Swal.fire({
      title: 'Are you sure?',
      text: 'This action will permanently delete the product.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
    }).then((result) => {
      if (result.isConfirmed) {
        this.productService.deleteProduct(id).subscribe({
          next: () => {
            this.loadProducts();
            Swal.fire({
              title: 'Deleted!',
              text: 'Product deleted successfully.',
              icon: 'success',
              timer: 1500,
              timerProgressBar: true,
              showConfirmButton: false,
              position: 'center',
            });
          },
          error: (err) => {
            console.error('Delete Error:', err);
            Swal.fire('Error', 'Failed to delete product', 'error');
          }
        });
      }
    });
  }

  toggleStatus(product: Product): void {
    const newStatus = product.status === 1 ? 0 : 1;

    this.productService.updateProduct(product._id!, { status: newStatus }).subscribe({
      next: () => {
        product.status = newStatus;
         Swal.fire('Updated', `Status changed`, 'success');
      },
      error: (err) => {
        console.error('Status Update Error:', err);
        Swal.fire('Error', 'Failed to update product status', 'error');
      },
    });
  }
}
