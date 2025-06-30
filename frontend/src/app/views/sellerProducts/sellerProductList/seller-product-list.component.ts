import { Component, OnInit } from '@angular/core';
import { ProductService, Product } from '../../../services/product.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-seller-product-list',
  templateUrl: './seller-product-list.component.html',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
})
export class SellerProductListComponent implements OnInit {
  products: Product[] = [];
  searchTerm = '';
  isLoading = false;

  constructor(
    private productService: ProductService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.isLoading = true;

    const queryParams = {
      search: this.searchTerm,
      added_by: 'seller',
    };

    this.productService.getAllProducts(queryParams).subscribe({
      next: (res) => {
        this.products = Array.isArray(res) ? res : res?.data || [];
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

  deleteProduct(id?: string): void {
    if (!id) return;

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
            Swal.fire({
              title: 'Deleted!',
              text: 'Product deleted successfully.',
              icon: 'success',
              timer: 1500,
              timerProgressBar: true,
              showConfirmButton: false,
              position: 'center',
            });
            this.loadProducts();
          },
          error: (err) => {
            console.error('Delete Error:', err);
            Swal.fire('Error', 'Failed to delete product', 'error');
          },
        });
      }
    });
  }

  updateRequestStatus(product: Product, status: 0 | 1 | 2): void {
    if (!product._id) return;

    this.productService.changeRequestStatus(product._id, status).subscribe({
      next: () => {
        Swal.fire(
          'Success',
          `Request status updated to ${this.getRequestStatusLabel(status)}.`,
          'success'
        ).then(() => {
          this.loadProducts(); // ✅ Reload the product list with updated data
        });
      },
      error: (err) => {
        console.error('Request Status Update Error:', err);
        Swal.fire('Error', 'Failed to update request status', 'error');
      },
    });
  }

  editProduct(id: string): void {
    this.router.navigate(['/products/edit', id]);
  }

  getRequestStatusLabel(status?: number | string): string {
    const s = Number(status);
    switch (s) {
      case 0:
        return 'Pending';
      case 1:
        return 'Approved';
      case 2:
        return 'Denied';
      default:
        return 'Unknown';
    }
  }

  getRequestStatusClass(status?: number | string): string {
    const s = Number(status);
    switch (s) {
      case 0:
        return 'badge bg-warning text-dark';
      case 1:
        return 'badge bg-success';
      case 2:
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
    }
  }

  getProductStatusLabel(status?: number | string): string {
    const s = Number(status);
    return s === 1 ? 'Active' : 'Inactive';
  }

  getProductStatusClass(status?: number | string): string {
    const s = Number(status);
    return s === 1 ? 'badge bg-primary' : 'badge bg-secondary';
  }
}
