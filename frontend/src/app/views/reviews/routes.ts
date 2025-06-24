import { Routes } from '@angular/router';
import { ReviewListComponent } from './review-list/review-list.component';
import { ReviewDetailComponent } from './review-details/review-detail.component'; // spelling fixed

export const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: ReviewListComponent,
        data: { title: 'Review List' },
      },
      {
        path: ':id',
        component: ReviewDetailComponent,
        data: { title: 'Review Details' },
      },
    ],
  },
];
