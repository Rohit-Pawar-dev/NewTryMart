import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { WithdrawalRequestComponent } from './withdrawal-request/withdrawal-request.component';
import { WithdrawalViewComponent } from './withdrawal-view/withdrawal-view.component';
import { routes } from './routes';

@NgModule({
  declarations: [],
  imports: [
    RouterModule.forChild(routes),
    CommonModule,
    FormsModule,        
    ReactiveFormsModule,
    WithdrawalRequestComponent,
    WithdrawalViewComponent,
  ],
})
export class WithdrawalModule {}
