import { Routes } from '@angular/router';
import { CouponListComponent } from './coupon-list/coupon-list.component';
import { CouponAddComponent } from './coupon-add/coupon-add.component';
import { CouponEditComponent } from './coupon-edit/coupon-edit.component';
import { CouponViewComponent } from './coupon-view/coupon-view.component';

export const routes: Routes = [
  {
    path: '',
    component: CouponListComponent,
    data: { title: 'Coupon List' },
  },
  {
    path: 'add',
    component: CouponAddComponent,
    data: { title: 'Add Coupon' },
  },
  {
    path: 'edit/:id',
    component: CouponEditComponent,
    data: { title: 'Edit Coupon' },
  },
  {
    path: 'view/:id',
    component: CouponViewComponent,
    data: { title: 'View Coupon' },
  },
];
