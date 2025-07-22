import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CategoryService, Category } from '../../../../app/services/category.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';

@Component({
  standalone: true,
  selector: 'app-category-view',
  templateUrl: './category-view.component.html',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
})
export class CategoryViewComponent implements OnInit {
  category: Category | null = null;
  isLoading: boolean = true;
  error: string | null = null;
  mediaUrl = environment.mediaUrl;

  constructor(
    private route: ActivatedRoute,
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];

   this.categoryService.getCategory(id).subscribe({
      next: (data) => {
        if (data) {
          this.category = {
            ...data,
            image: data.image ? this.mediaUrl + data.image : ""
          };
        }
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Failed to load category.';
        this.isLoading = false;
      }
    });
  }
}
