import { Component, OnInit } from '@angular/core';
import { CategoryService, Category } from '../../../services/category.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

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

  constructor(private categoryService: CategoryService, private router: Router) {}

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.isLoading = true;
    this.categoryService.getCategories({ search: this.searchTerm }).subscribe({
      next: (data) => {
        this.categories = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading categories:', err);
        this.isLoading = false;
      }
    });
  }

  onSearchChange() {
    this.loadCategories();
  }

  deleteCategory(id: string) {
    if (confirm('Are you sure to delete?')) {
      this.categoryService.deleteCategory(id).subscribe(() => this.loadCategories());
    }
  }

  toggleStatus(category: Category) {
    const newStatus = category.status === 'active' ? 'inactive' : 'active';
    this.categoryService.updateCategory(category._id!, { status: newStatus }).subscribe(() => this.loadCategories());
  }
}
