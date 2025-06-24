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

  constructor(private reviewsService: ReviewsService) {}

  ngOnInit(): void {
    this.fetchReviews();
  }

  fetchReviews(): void {
    this.isLoading = true;
    this.error = null;

    this.reviewsService.getReviews().subscribe({
      next: (res) => {
        this.reviews = res;
        console.log('Fetched reviews:', this.reviews);

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
}
