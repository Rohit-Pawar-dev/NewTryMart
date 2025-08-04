import { Component, OnInit } from '@angular/core';
import {
  SubCategoryService,
  SubCategory,
} from '../../../services/sub-category.service';
import { CategoryService } from '../../../services/category.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { FormsModule } from '@angular/forms';

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
  mediaBaseUrl = environment.mediaUrl;

  // Pagination properties
  page = 1;
  pageSize = 10;
  totalPages = 0;
  totalRecords = 0;

  constructor(
    private subCategoryService: SubCategoryService,
    private categoryService: CategoryService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.categoryService.getCategories().subscribe({
      next: (res) => {
        // 'res' shape: { data: Category[], total: number, ... }
        // Create a map of category id => name
        this.categoriesMap = Object.fromEntries(
          res.data.map((c) => [c._id ?? '', c.name])
        );
        this.loadSubCategories();
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  loadSubCategories(): void {
    this.isLoading = true;
    this.subCategoryService
      .getSubCategories({
        search: this.searchTerm,
        page: this.page,
        pageSize: this.pageSize,
        all: true,
      })
      .subscribe({
        next: (res) => {
          // res shape: { data: SubCategory[], total: number, ... }
          this.subCategories = res.data.map((subCat) => ({
            ...subCat,
            image: subCat.image ? this.mediaBaseUrl + subCat.image : '',
          }));
          this.totalRecords = res.total;
          this.totalPages = Math.ceil(res.total / this.pageSize);
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading sub-categories:', err);
          this.isLoading = false;
        },
      });
  }

  onSearchChange(): void {
    this.page = 1;
    this.loadSubCategories();
  }

  goToPage(p: number): void {
    if (p >= 1 && p <= this.totalPages) {
      this.page = p;
      this.loadSubCategories();
    }
  }

  async deleteSubCategory(id: string): Promise<void> {
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

  toggleStatus(subCategory: SubCategory): void {
    const newStatus = subCategory.status === 'active' ? 'inactive' : 'active';
    this.subCategoryService
      .updateSubCategory(subCategory._id ?? '', { status: newStatus })
      .subscribe({
        next: () => {
          Swal.fire('Updated!', `Status changed to ${newStatus}.`, 'success');
          this.loadSubCategories();
        },
        error: () => {
          Swal.fire('Error', 'Failed to update status.', 'error');
        },
      });
  }

  getCategoryName(
    cat: string | { _id: string; name: string } | null | undefined
  ): string {
    if (typeof cat === 'object' && cat !== null) {
      return cat.name;
    }
    return cat && this.categoriesMap[cat] ? this.categoriesMap[cat] : 'N/A';
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.src = 'assets/images/default-product.jpg';
  }
}
