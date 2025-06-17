import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { routes } from './routes';
import { CouponListComponent } from './coupon-list/coupon-list.component';
import { CouponAddComponent } from './coupon-add/coupon-add.component';
import { CouponEditComponent } from './coupon-edit/coupon-edit.component';
import { CouponViewComponent } from './coupon-view/coupon-view.component';

@NgModule({
  // No declarations for standalone components
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),

    // These are standalone components, so they go in `imports`, not `declarations`
    CouponListComponent,
    CouponAddComponent,
    CouponEditComponent,
    CouponViewComponent
  ]
})
export class CouponsModule {}
