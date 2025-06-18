import { Routes } from '@angular/router';
import { ReviewListComponent } from './review-list/review-list.component';
// import { ReviewDetailComponent } from './review-details/review-detail.component'; // spelling fixed

export const routes: Routes = [
  { path: '', redirectTo: 'reviews', pathMatch: 'full' },
  { path: 'reviews', component: ReviewListComponent },
//   { path: 'reviews/:id', component: ReviewDetailComponent }, // Added detail route
  { path: '**', redirectTo: 'reviews' }
];
