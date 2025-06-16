import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { routes } from './routes';
import { SubCategoryListComponent } from './sub-category-list/sub-category-list.component';
import { SubCategoryAddComponent } from './sub-category-add/sub-category-add.component';
import { SubCategoryEditComponent } from './sub-category-edit/sub-category-edit.component';
import { SubCategoryViewComponent } from './sub-category-view/sub-category-view.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),

    SubCategoryListComponent,
    SubCategoryAddComponent,
    SubCategoryEditComponent,
    SubCategoryViewComponent
  ]
})
export class SubCategoriesModule {}
