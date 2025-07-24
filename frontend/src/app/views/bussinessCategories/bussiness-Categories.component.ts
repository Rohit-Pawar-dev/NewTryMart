import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { BusinessCategoriesService, BusinessCategory } from '../../services/bussinessCategories.service';

@Component({
  selector: 'app-business-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './business-categories.component.html',
})
export class BusinessCategoriesComponent implements OnInit {
  categories: BusinessCategory[] = [];
  newCategory: BusinessCategory = { name: '', description: '', status: 'active' };

  // Pagination
  limit = 10;
  currentPage = 1;
  totalPages = 0;
  totalItems = 0;

  Math = Math;

  constructor(private categoryService: BusinessCategoriesService) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.categoryService
      .getCategories({ page: this.currentPage, limit: this.limit })
      .subscribe({
        next: (res) => {
          this.categories = res.data;
          this.totalItems = res.total;
          this.totalPages = res.totalPages;
        },
        error: () => {
          Swal.fire('Error', 'Failed to load categories.', 'error');
        },
      });
  }

  createCategory(): void {
    if (!this.newCategory.name) {
      Swal.fire('Validation Error', 'Name is required.', 'warning');
      return;
    }

    this.categoryService.createCategory(this.newCategory).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Category created successfully!',
          timer: 2000,
          showConfirmButton: false,
        });
        this.newCategory = { name: '', description: '', status: 'active' };
        this.loadCategories();
      },
      error: (err) => {
        const msg = err?.error?.message || 'Failed to create category.';
        Swal.fire('Error', msg, 'error');
      },
    });
  }

  deleteCategory(id: string): void {
    Swal.fire({
      title: 'Are you sure?',
      text: "This will delete the category permanently.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
    }).then((result) => {
      if (result.isConfirmed) {
        this.categoryService.deleteCategory(id).subscribe({
          next: () => {
            Swal.fire('Deleted!', 'Category has been deleted.', 'success');
            this.loadCategories();
          },
          error: () => {
            Swal.fire('Error!', 'Failed to delete category.', 'error');
          },
        });
      }
    });
  }

  // Inside BusinessCategoriesComponent class

toggleStatus(category: BusinessCategory): void {
  const updatedStatus = category.status === 'active' ? 'inactive' : 'active';

  this.categoryService
    .updateCategory(category._id!, { status: updatedStatus })
    .subscribe({
      next: () => {
        category.status = updatedStatus; // update UI immediately
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: `Status changed to ${updatedStatus}`,
          timer: 1500,
          showConfirmButton: false,
        });
      },
      error: () => {
        Swal.fire('Error', 'Failed to update status.', 'error');
      },
    });
}


  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadCategories();
    }
  }
}
