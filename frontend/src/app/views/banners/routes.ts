import { Routes } from '@angular/router';
import { BannerListComponent } from './banner-list/banner-list.component';
import { BannerAddComponent } from './banner-add/banner-add.component';
import { BannerEditComponent } from './banner-edit/banner-edit.component';
import { BannerViewComponent } from './banner-view/banner-view.component';

export const routes: Routes = [
  { path: '', component: BannerListComponent },
  { path: 'add', component: BannerAddComponent },
  { path: 'edit/:id', component: BannerEditComponent },
  { path: 'view/:id', component: BannerViewComponent },
];
