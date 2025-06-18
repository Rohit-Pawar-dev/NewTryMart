import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ReviewListComponent } from './review-list/review-list.component';
// import { ReviewDetailComponent } from './review-details/review-detail.component';
import { routes } from './routes';

@NgModule({
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    RouterModule.forChild(routes),
    ReviewListComponent,       // ✅ Standalone Component imported here
    // ReviewDetailComponent      // ✅ Standalone Component imported here
  ]
})
export class ReviewsModule {}
