import { Component, OnInit } from '@angular/core';
import { CategoryService, Category } from '../../../services/category.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-category-list',
  templateUrl: './category-list.component.html',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
})
export class CategoryListComponent implements OnInit {
  categories: Category[] = [];
  searchTerm = '';
  isLoading = false;
  public Math = Math;
  mediaBaseUrl = environment.mediaUrl;

  // Pagination properties
  page = 1;
  pageSize = 10;
  total = 0;
  totalPages = 0;

  constructor(
    private categoryService: CategoryService,
    private router: Router
  ) { }

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.isLoading = true;
    const offset = (this.page - 1) * this.pageSize;

    this.categoryService
      .getCategories({
        search: this.searchTerm,
        limit: this.pageSize,
        offset: offset,
        all: true
      })
      .subscribe({
        next: (res) => {
          this.categories = res.data.map((category) => ({
            ...category,
            image: this.mediaBaseUrl + category.image,
          }));
          this.total = res.total;
          this.totalPages = res.totalPages;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading categories:', err);
          this.isLoading = false;
          Swal.fire('Error', 'Failed to load categories', 'error');
        },
      });
  }

  onSearchChange() {
    this.page = 1; // Reset to first page on search
    this.loadCategories();
  }

  goToPage(p: number) {
    if (p >= 1 && p <= this.totalPages) {
      this.page = p;
      this.loadCategories();
    }
  }

  deleteCategory(id: string) {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This will permanently delete the category.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
    }).then((result) => {
      if (result.isConfirmed) {
        this.categoryService.deleteCategory(id).subscribe({
          next: () => {
            this.loadCategories();
            Swal.fire({
              title: 'Deleted!',
              text: 'Category deleted successfully.',
              icon: 'success',
              timer: 1500,
              timerProgressBar: true,
              showConfirmButton: false,
              position: 'center',
            });
          },
          error: (err) => {
            console.error('Delete Error:', err);
            Swal.fire('Error', 'Failed to delete category', 'error');
          },
        });
      }
    });
  }

  toggleStatus(category: Category) {
    const newStatus = category.status === 'active' ? 'inactive' : 'active';

    this.categoryService
      .updateCategory(category._id!, { status: newStatus })
      .subscribe({
        next: () => {
          category.status = newStatus;
          Swal.fire('Updated', `Status changed`, 'success');
        },
        error: (err) => {
          console.error('Status Update Error:', err);
          Swal.fire('Error', 'Failed to update category status', 'error');
        },
      });
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.src = 'assets/images/default-product.jpg';
  }
}
