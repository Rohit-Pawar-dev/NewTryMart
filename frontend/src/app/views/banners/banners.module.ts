import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { routes } from './routes';
import { BannerListComponent } from './banner-list/banner-list.component';
import { BannerAddComponent } from './banner-add/banner-add.component';
import { BannerEditComponent } from './banner-edit/banner-edit.component';
import { BannerViewComponent } from './banner-view/banner-view.component';

@NgModule({
  declarations: [
    
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),

    BannerListComponent,
    BannerAddComponent,
    BannerEditComponent,
    BannerViewComponent
  ]
})
export class BannersModule {}
