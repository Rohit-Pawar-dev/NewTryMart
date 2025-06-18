import { Routes } from '@angular/router';
import { ReviewListComponent } from './review-list/review-list.component';

export const routes: Routes = [
  { path: '', redirectTo: 'reviews', pathMatch: 'full' },  
  { path: 'reviews', component: ReviewListComponent },     
  { path: '**', redirectTo: 'reviews' },                    
];
