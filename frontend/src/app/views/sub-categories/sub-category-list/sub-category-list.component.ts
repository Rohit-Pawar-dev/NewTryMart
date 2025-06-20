import { Component, OnInit } from '@angular/core';
import {
  SubCategoryService,
  SubCategory,
} from '../../../services/sub-category.service';
import { CategoryService, Category } from '../../../services/category.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

// Import SweetAlert2
import Swal from 'sweetalert2';

@Component({
  selector: 'app-sub-category-list',
  templateUrl: './sub-category-list.component.html',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
})
export class SubCategoryListComponent implements OnInit {
  subCategories: SubCategory[] = [];
  categoriesMap: { [id: string]: string } = {};
  searchTerm = '';
  isLoading = false;

  constructor(
    private subCategoryService: SubCategoryService,
    private categoryService: CategoryService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    this.categoryService.getCategories().subscribe({
      next: (cats) => {
        this.categoriesMap = Object.fromEntries(
          cats.map((c) => [c._id!, c.name])
        );
        this.loadSubCategories();
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  loadSubCategories() {
    this.subCategoryService
      .getSubCategories({ search: this.searchTerm })
      .subscribe({
        next: (data) => {
          this.subCategories = data;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading sub-categories:', err);
          this.isLoading = false;
        },
      });
  }

  onSearchChange() {
    this.loadSubCategories();
  }

  async deleteSubCategory(id: string) {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'You won’t be able to revert this!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    });

    if (result.isConfirmed) {
      this.subCategoryService.deleteSubCategory(id).subscribe({
        next: () => {
          Swal.fire('Deleted!', 'Sub-category has been deleted.', 'success');
          this.loadSubCategories();
        },
        error: () => {
          Swal.fire('Error', 'Failed to delete sub-category.', 'error');
        },
      });
    }
  }

  toggleStatus(subCategory: SubCategory) {
    const newStatus = subCategory.status === 'active' ? 'inactive' : 'active';
    this.subCategoryService
      .updateSubCategory(subCategory._id!, { status: newStatus })
      .subscribe({
        next: () => {
          Swal.fire(
            'Updated!',
            `Status changed to ${newStatus}.`,
            'success'
          );
          this.loadSubCategories();
        },
        error: () => {
          Swal.fire('Error', 'Failed to update status.', 'error');
        },
      });
  }

  getCategoryName(cat: string | { _id: string; name: string }): string {
    return typeof cat === 'object' && cat !== null ? cat.name : 'N/A';
  }
}
