import { Routes } from '@angular/router';
import { AdminProfileComponent } from './admin-profile.component';

export const routes: Routes = [
  {
    path: '',
    component: AdminProfileComponent,
    data: {
      title: 'Admin Profile'
    }
  }
];
