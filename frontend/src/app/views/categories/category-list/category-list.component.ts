import { Component, OnInit } from '@angular/core';
import { CategoryService, Category } from '../../../services/category.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
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

  constructor(
    private categoryService: CategoryService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.isLoading = true;
    this.categoryService
      .getCategories({ search: this.searchTerm, all: true })
      .subscribe({
        next: (data) => {
          this.categories = data;
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
    this.loadCategories();
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
}
