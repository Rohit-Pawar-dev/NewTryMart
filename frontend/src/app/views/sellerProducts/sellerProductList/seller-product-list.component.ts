import { Component, OnInit } from '@angular/core';
import { ProductService, Product } from '../../../services/product.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';
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
  requestStatusFilter: string = '';
  isLoading = false;

  // Pagination State
  limit = 10;
  offset = 0;
  total = 0;
  mediaUrl = environment.mediaUrl;

  constructor(private productService: ProductService, private router: Router) { }

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.isLoading = true;

    const queryParams: any = {
      search: this.searchTerm,
      added_by: 'seller',
      limit: this.limit,
      offset: this.offset,
    };
    if (this.requestStatusFilter !== '') {
      queryParams.request_status = this.requestStatusFilter;
    }

    this.productService.getAllProducts(queryParams).subscribe({
      next: (res) => {
        // this.products = Array.isArray(res) ? res : res.data || [];
        const prependBase = (path: string) =>
          path && !/^https?:\/\//i.test(path) ? this.mediaUrl + path : path;

        this.products = (res.data || []).map((product: any) => {
          return {
            ...product,
            thumbnail: prependBase(product.thumbnail),
            images: (product.images || []).map(prependBase),
            category_id: product.category_id
              ? {
                ...product.category_id,
                image: prependBase(product.category_id.image),
              }
              : null,
            sub_category_id: product.sub_category_id
              ? {
                ...product.sub_category_id,
                image: prependBase(product.sub_category_id.image),
              }
              : null,
            variation_options: (product.variation_options || []).map((opt: any) => ({
              ...opt,
              images: (opt.images || []).map(prependBase),
            })),
          };
        });

        this.total = res.total || 0;
        this.limit = res.limit || this.limit;
        this.offset = res.offset || this.offset;
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
    this.offset = 0;
    this.loadProducts();
  }

  editProduct(id: string): void {
    this.router.navigate(['/admin/products/edit', id]);
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
          },
        });
      }
    });
  }

  toggleStatus(product: Product): void {
    const newStatus = product.status === 1 ? 0 : 1;

    this.productService
      .updateProductStatus({ id: product._id!, status: newStatus })
      .subscribe({
        next: (res) => {
          if (res.success === 1) {
            product.status = newStatus;
            Swal.fire('Updated', `Status changed`, 'success');
          } else {
            Swal.fire(
              'Blocked',
              'Product cannot be activated until approved by admin.',
              'warning'
            );
          }
        },
        error: (err) => {
          console.error('Status Update Error:', err);
          Swal.fire('Error', 'Failed to update product status', 'error');
        },
      });
  }
  get currentPage(): number {
    return Math.floor(this.offset / this.limit) + 1;
  }
  get totalPages(): number {
    return Math.ceil(this.total / this.limit);
  }
  nextPage(): void {
    if (this.offset + this.limit < this.total) {
      this.offset += this.limit;
      this.loadProducts();
    }
  }
  prevPage(): void {
    if (this.offset >= this.limit) {
      this.offset -= this.limit;
      this.loadProducts();
    }
  }
  goToPage(page: number): void {
    const newOffset = (page - 1) * this.limit;
    if (newOffset >= 0 && newOffset < this.total) {
      this.offset = newOffset;
      this.loadProducts();
    }
  }
  toggleOffer(product: Product): void {
    const updatedValue = !product.is_offers;
    this.productService.updateProduct(product._id!, { is_offers: updatedValue }).subscribe({
      next: () => {
        product.is_offers = updatedValue;
        Swal.fire('Updated', `Offer ${updatedValue ? 'enabled' : 'disabled'}`, 'success');
      },
      error: (err) => {
        console.error('Toggle Offer Error:', err);
        Swal.fire('Error', 'Failed to update offer status', 'error');
      }
    });
  }
  toggleTrending(product: Product): void {
    const updatedValue = !product.is_trending;
    this.productService.updateProduct(product._id!, { is_trending: updatedValue }).subscribe({
      next: () => {
        product.is_trending = updatedValue;
        Swal.fire('Updated', `Trending ${updatedValue ? 'enabled' : 'disabled'}`, 'success');
      },
      error: (err) => {
        console.error('Toggle Trending Error:', err);
        Swal.fire('Error', 'Failed to update trending status', 'error');
      }
    });
  }
}