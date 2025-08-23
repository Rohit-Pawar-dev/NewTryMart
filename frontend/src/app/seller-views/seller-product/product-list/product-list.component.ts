import { Component, OnInit } from '@angular/core';
import { ProductService, Product } from '../../../services/product.service';
import { SellerAuthService } from '../../../services/sellerAuth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { environment } from '../../../../environments/environment';

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
  mediaUrl = environment.mediaUrl;
  requestStatus: string = '';
  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 0;
  totalItems = 0;
  constructor(private sellerAuthService: SellerAuthService, private productService: ProductService, private router: Router) { }

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.isLoading = true;

    const queryParams: any = {
      limit: this.pageSize,
      offset: (this.currentPage - 1) * this.pageSize,
      search: this.searchTerm,
      added_by: 'seller',
    };

    if (this.requestStatus) {
      queryParams.request_status = this.requestStatus;
    }

    this.sellerAuthService.getSellerProducts(queryParams).subscribe({
      next: (res) => {
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

        this.totalItems = res.total || 0;
        this.totalPages = Math.ceil(this.totalItems / this.pageSize);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading products:', err);
        this.isLoading = false;
        Swal.fire('Error', 'Failed to load products', 'error');
      },
    });
  }
  onRequestStatusChange(): void {
    this.currentPage = 1;
    this.loadProducts();
  }


  onSearchChange(): void {
    this.currentPage = 1;
    this.loadProducts();
  }
  editProduct(id: string): void {
    this.router.navigate(['/seller/products/edit', id]);
  }

  deleteProduct(id: string): void {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This will permanently delete the product.',
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
            Swal.fire('Deleted!', 'Product deleted successfully.', 'success');
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

    this.sellerAuthService
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


  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadProducts();
    }
  }

  // exportProducts(): void {
  //   if (!this.products || this.products.length === 0) {
  //     Swal.fire('No Products', 'There are no products to export.', 'info');
  //     return;
  //   }

  //   const exportData = this.products.map(product => ({
  //     Name: product.name,
  //     Price: product.unit_price,
  //     Category: product.category_id || '',
  //     SubCategory: product.sub_category_id || '',
  //     Seller: product.seller_id || '',
  //     AddedBy: product.added_by,
  //     Status: product.status === 1 ? 'Active' : 'Inactive',
  //   }));

  //   const csvContent = this.convertToCSV(exportData);
  //   const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  //   const url = URL.createObjectURL(blob);

  //   const link = document.createElement('a');
  //   link.setAttribute('href', url);
  //   link.setAttribute('download', 'products_export.csv');
  //   link.click();
  // }

  exportAllProducts(): void {
    Swal.fire({
      title: 'Exporting...',
      text: 'Fetching all products for export. Please wait...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    const queryParams = {
      limit: 1000000,
      offset: 0,
      added_by: 'admin'
    };

    this.productService.getAllProducts(queryParams).subscribe({
      next: (res) => {
        const allProducts: Product[] = res.data || [];

        if (allProducts.length === 0) {
          Swal.fire('No Products', 'There are no products to export.', 'info');
          return;
        }

        const exportData = allProducts.map((product: Product) => {
          const category = typeof product.category_id === 'object' ? (product.category_id as any)?.name : product.category_id;
          const subCategory = typeof product.sub_category_id === 'object' ? (product.sub_category_id as any)?.name : product.sub_category_id;
          const seller = typeof product.seller_id === 'object' ? (product.seller_id as any)?.name : product.seller_id;

          return {
            Name: product.name,
            Price: product.unit_price,
            Category: category || '',
            SubCategory: subCategory || '',
            Seller: seller || '',
            AddedBy: product.added_by,
            Status: product.status === 1 ? 'Active' : 'Inactive',
          };
        });

        const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
        const workbook: XLSX.WorkBook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
        const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

        const file = new Blob([excelBuffer], { type: 'application/octet-stream' });
        FileSaver.saveAs(file, 'all_products_export.xlsx');

        Swal.close();
      },
      error: (err) => {
        console.error('Export Error:', err);
        Swal.fire('Error', 'Failed to fetch products for export.', 'error');
      }
    });
  }



  exportProducts(): void {
    if (!this.products || this.products.length === 0) {
      Swal.fire('No Products', 'There are no products to export.', 'info');
      return;
    }

    const exportData = this.products.map(product => {
      const category = typeof product.category_id === 'object' ? (product.category_id as any)?.name : product.category_id;
      const subCategory = typeof product.sub_category_id === 'object' ? (product.sub_category_id as any)?.name : product.sub_category_id;
      const seller = typeof product.seller_id === 'object' ? (product.seller_id as any)?.name : product.seller_id;

      return {
        Name: product.name,
        Price: product.unit_price,
        Category: category,
        SubCategory: subCategory,
        Seller: seller,
        AddedBy: product.added_by,
        Status: product.status === 1 ? 'Active' : 'Inactive',
      };
    });

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
    const workbook: XLSX.WorkBook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    const file = new Blob([excelBuffer], { type: 'application/octet-stream' });
    FileSaver.saveAs(file, 'products_export.xlsx');
  }


  convertToCSV(objArray: any[]): string {
    const headers = Object.keys(objArray[0]).join(',');
    const rows = objArray.map(obj =>
      Object.values(obj)
        .map(val => `"${val}"`)
        .join(',')
    );
    return [headers, ...rows].join('\r\n');
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.src = 'assets/images/default-product.jpg';
  }
}
