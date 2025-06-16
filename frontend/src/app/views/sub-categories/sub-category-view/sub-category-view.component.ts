import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SubCategoryService, SubCategory } from '../../../../app/services/sub-category.service';
import { CategoryService } from '../../../../app/services/category.service';

@Component({
  standalone: true,
  selector: 'app-sub-category-view',
  templateUrl: './sub-category-view.component.html',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
})
export class SubCategoryViewComponent implements OnInit {
  subCategory: SubCategory | null = null;
  parentCategoryName: string = '';
  isLoading: boolean = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private subCategoryService: SubCategoryService,
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {
  const id = this.route.snapshot.params['id'];

  this.subCategoryService.getSubCategory(id).subscribe({
    next: (data) => {
      this.subCategory = data;

      // if category_id is populated object, use its name directly
      if (typeof data.category_id === 'object' && data.category_id !== null) {
        this.parentCategoryName = data.category_id.name;
      }

      this.isLoading = false;
    },
    error: () => {
      this.error = 'Failed to load sub-category.';
      this.isLoading = false;
    },
  });
}

}
