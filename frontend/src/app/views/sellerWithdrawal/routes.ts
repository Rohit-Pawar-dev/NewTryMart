import { Routes } from '@angular/router';
import { WithdrawalRequestComponent } from './withdrawal-request/withdrawal-request.component';
import { WithdrawalViewComponent } from './withdrawal-view/withdrawal-view.component';

export const routes: Routes = [
  { path: '', component: WithdrawalRequestComponent },
  { path: ':id', component: WithdrawalViewComponent },
];
