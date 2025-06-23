// routes.ts
import { Routes } from '@angular/router';
import { StaticPagesComponent } from './static-pages.component';

export const routes: Routes = [
  {
    path: '',
    component: StaticPagesComponent,
    data: {
      title: 'Static Pages',
    },
  },
];
