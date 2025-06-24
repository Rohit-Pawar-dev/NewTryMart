import { Routes } from '@angular/router';
import { CategoryListComponent } from './category-list/category-list.component';
import { CategoryAddComponent } from './category-add/category-add.component';
import { CategoryEditComponent } from './category-edit/category-edit.component';
import { CategoryViewComponent } from './category-view/category-view.component';

export const routes: Routes = [
  {
    path: '',
    component: CategoryListComponent,
    data: { title: 'Category List' },
  },
  {
    path: 'add',
    component: CategoryAddComponent,
    data: { title: 'Add Category' },
  },
  {
    path: 'edit/:id',
    component: CategoryEditComponent,
    data: { title: 'Edit Category' },
  },
  {
    path: 'view/:id',
    component: CategoryViewComponent,
    data: { title: 'View Category' },
  },
];
