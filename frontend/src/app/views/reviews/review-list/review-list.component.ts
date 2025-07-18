import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ReviewsService, Review } from '../../../services/reviews.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-review-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './review-list.component.html',
})
export class ReviewListComponent implements OnInit {
  reviews: Review[] = [];
  isLoading = false;
  error: string | null = null;
  selectedReview: Review | null = null;

  // Pagination
  limit = 10;
  offset = 0;
  total = 0;

  constructor(private reviewsService: ReviewsService) { }

  ngOnInit(): void {
    this.fetchReviews();
  }

  fetchReviews(): void {
    this.isLoading = true;
    this.error = null;

    this.reviewsService
      .getReviews({ limit: this.limit, offset: this.offset })
      .subscribe({
        next: (response: any) => {
          // If service returns full response with data, total, etc.
          this.reviews = response.data ?? response;
          this.total = response.total ?? 0;
          this.limit = response.limit ?? this.limit;
          this.offset = response.offset ?? this.offset;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error fetching reviews:', err);
          this.error = 'Failed to load reviews.';
          this.isLoading = false;
        },
      });
  }

  selectReview(review: Review): void {
    this.selectedReview = review;
  }

  // Pagination Helpers
  get currentPage(): number {
    return Math.floor(this.offset / this.limit) + 1;
  }

  get totalPages(): number {
    return Math.ceil(this.total / this.limit);
  }

  nextPage(): void {
    if (this.offset + this.limit < this.total) {
      this.offset += this.limit;
      this.fetchReviews();
    }
  }

  prevPage(): void {
    if (this.offset >= this.limit) {
      this.offset -= this.limit;
      this.fetchReviews();
    }
  }

  goToPage(page: number): void {
    const newOffset = (page - 1) * this.limit;
    if (newOffset >= 0 && newOffset < this.total) {
      this.offset = newOffset;
      this.fetchReviews();
    }
  }
}
