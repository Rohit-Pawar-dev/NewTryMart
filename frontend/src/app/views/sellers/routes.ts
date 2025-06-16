import { Routes } from '@angular/router';
import { SellerListComponent } from './seller-list/seller-list.component';
import { SellerAddComponent } from './seller-add/seller-add.component';
import { SellerEditComponent } from './seller-edit/seller-edit.component';
import { SellerViewComponent } from './seller-view/seller-view.component';

export const routes: Routes = [
  {
    path: '',
    component: SellerListComponent,
    data: {
      title: 'Sellers'
    }
  },
  {
    path: 'add',
    component: SellerAddComponent,
    data: {
      title: 'Add Seller'
    }
  },
  {
    path: 'edit/:id',
    component: SellerEditComponent,
    data: {
      title: 'Edit Seller'
    }
  },
  {
    path: 'view/:id',
    component: SellerViewComponent,
    data: {
      title: 'View Seller'
    }
  }
];
