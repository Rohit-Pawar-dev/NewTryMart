import { Routes } from '@angular/router';
import { SubCategoryListComponent } from './sub-category-list/sub-category-list.component';
import { SubCategoryAddComponent } from './sub-category-add/sub-category-add.component';
import { SubCategoryEditComponent } from './sub-category-edit/sub-category-edit.component';
import { SubCategoryViewComponent } from './sub-category-view/sub-category-view.component';

export const routes: Routes = [
  {
    path: '',
    component: SubCategoryListComponent,
    data: { title: 'Subcategory List' },
  },
  {
    path: 'add',
    component: SubCategoryAddComponent,
    data: { title: 'Add Subcategory' },
  },
  {
    path: 'edit/:id',
    component: SubCategoryEditComponent,
    data: { title: 'Edit Subcategory' },
  },
  {
    path: 'view/:id',
    component: SubCategoryViewComponent,
    data: { title: 'View Subcategory' },
  },
];
