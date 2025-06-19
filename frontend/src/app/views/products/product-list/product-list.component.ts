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
      text: 'Do you really want to delete this product?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        this.productService.deleteProduct(id).subscribe(() => {
          this.loadProducts();
          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'Product deleted successfully',
            showConfirmButton: false,
            timer: 1500,
            timerProgressBar: true,
            toast: false,
          });
        });
      }
    });
  }

  toggleStatus(product: Product): void {
    const newStatus = product.status === 1 ? 0 : 1;
    this.productService.updateProduct(product._id!, { status: newStatus }).subscribe({
      next: () => {
        // Just update the product's status locally to avoid reloading all products
        product.status = newStatus;

        // Show success toast without confirmation
        Swal.fire({
           position: 'center',
          icon: 'success',
          title: `Product is now ${newStatus === 1 ? 'Active' : 'Inactive'}`,
          showConfirmButton: false,
          timer: 1500,
          timerProgressBar: true,
          toast: true,
        });
      },
      error: (err) => {
        console.error('Failed to update status:', err);
        Swal.fire('Error', 'Failed to update product status', 'error');
      },
    });
  }
}
