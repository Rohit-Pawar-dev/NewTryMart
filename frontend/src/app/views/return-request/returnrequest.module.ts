import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { routes } from './routes';
import { ReturnRequestListComponent } from './return-request-list/return-request-list.component';
import { ReturnRequestViewComponent } from './return-request-view/return-request-view.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    RouterModule.forChild(routes),
    ReturnRequestListComponent,
    ReturnRequestViewComponent,
  ],
})
export class ReturnRequestModule {}
