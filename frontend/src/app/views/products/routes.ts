import { Routes } from '@angular/router';
import { ProductListComponent } from './product-list/product-list.component';
import { ProductAddComponent } from './product-add/product-add.component';
import { ProductEditComponent } from './product-edit/product-edit.component';
import { ProductViewComponent } from './product-view/product-view.component';

export const routes: Routes = [
  {
    path: '',
    component: ProductListComponent,
    data: { title: 'Product List' },
  },
  {
    path: 'add',
    component: ProductAddComponent,
    data: { title: 'Add Product' },
  },
  {
    path: 'edit/:id',
    component: ProductEditComponent,
    data: { title: 'Edit Product' },
  },
  {
    path: 'view/:id',
    component: ProductViewComponent,
    data: { title: 'View Product' },
  },
];
