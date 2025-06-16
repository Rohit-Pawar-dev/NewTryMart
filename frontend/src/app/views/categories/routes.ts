import { Routes } from '@angular/router';
import { CategoryListComponent } from './category-list/category-list.component';
import { CategoryAddComponent } from './category-add/category-add.component';
import { CategoryEditComponent } from './category-edit/category-edit.component';
import { CategoryViewComponent } from './category-view/category-view.component';

export const routes: Routes = [
  { path: '', component: CategoryListComponent },
  { path: 'add', component: CategoryAddComponent },
  { path: 'edit/:id', component: CategoryEditComponent },
  { path: 'view/:id', component: CategoryViewComponent },
];
