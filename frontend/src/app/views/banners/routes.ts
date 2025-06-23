import { Routes } from '@angular/router';
import { BannerListComponent } from './banner-list/banner-list.component';
import { BannerAddComponent } from './banner-add/banner-add.component';
import { BannerEditComponent } from './banner-edit/banner-edit.component';
import { BannerViewComponent } from './banner-view/banner-view.component';

export const routes: Routes = [
  {
    path: '',
    component: BannerListComponent,
    data: { title: 'Banners' },
  },
  {
    path: 'add',
    component: BannerAddComponent,
    data: { title: 'Add Banner' },
  },
  {
    path: 'edit/:id',
    component: BannerEditComponent,
    data: { title: 'Edit Banner' },
  },
  {
    path: 'view/:id',
    component: BannerViewComponent,
    data: { title: 'View Banner' },
  },
];
