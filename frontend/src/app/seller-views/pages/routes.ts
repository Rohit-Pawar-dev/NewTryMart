import { Routes } from '@angular/router';

export const routes: Routes = [
    {
    path: 'login',
    loadComponent: () => import('./login/login.component').then(m => m.SellerLoginComponent),
    data: {
      title: 'Login Page'
    }
  },
];