import { Routes } from '@angular/router';
import { ProductListComponent } from './product-list/product-list.component';
import { ProductAddComponent } from './product-add/product-add.component';
import { ProductEditComponent } from './product-edit/product-edit.component';
import {ProductViewComponent} from './product-view/product-view.component';
 
export const routes: Routes = [
  { path: '', component: ProductListComponent },
  { path: 'add', component: ProductAddComponent },
  { path: 'edit/:id', component: ProductEditComponent },
  {path: 'view/:id', component: ProductViewComponent}
];
