import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReviewsService, Review } from '../../../services/reviews.service';
import { RouterModule } from '@angular/router';
@Component({
  selector: 'app-review-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './review-detail.component.html',
})
export class ReviewDetailComponent implements OnInit {
  review: Review | null = null;
  isLoading = false;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private reviewsService: ReviewsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.fetchReview(id);
  }

  fetchReview(id: string): void {
    this.isLoading = true;
    this.reviewsService.getReview(id).subscribe({
      next: (review) => {
        this.review = review;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading review:', err);
        this.error = 'Failed to load review.';
        this.isLoading = false;
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/reviews']);
  }
}
