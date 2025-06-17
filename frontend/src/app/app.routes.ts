import { Routes } from '@angular/router';
import { DefaultLayoutComponent } from './layout';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: '',
    component: DefaultLayoutComponent,
    data: {
      title: 'Home',
    },
    children: [
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./views/dashboard/routes').then((m) => m.routes),
      },

      {
        path: 'users',
        loadChildren: () =>
          import('./views/users/users.module').then((m) => m.UsersModule),
      },

      {
        path: 'sellers',
        loadChildren: () =>
          import('./views/sellers/sellers.module').then((m) => m.SellersModule),
      },

      // {
      //   path: 'delivery-men',
      //   loadChildren: () =>
      //     import('./views/delivery-men/delivery-men.module').then(
      //       (m) => m.DeliveryMenModule
      //     ),
      // },

      {
        path: 'banners',
        loadChildren: () =>
          import('./views/banners/banners.module').then((m) => m.BannersModule),
      },

      {
        path: 'categories',
        loadChildren: () =>
          import('./views/categories/categories.module').then(
            (m) => m.CategoriesModule
          ),
      },
       {
    path: 'products',
    loadChildren: () =>
      import('./views/products/product.module').then((m) => m.ProductModule),
  },

{
loadChildren: () =>
  import('./views/reviews/reviews.module').then((m) => m.ReviewsModule),

},
      {
        path: 'sub-categories',
        loadChildren: () =>
          import('./views/sub-categories/subCategories.module').then(
            (m) => m.SubCategoriesModule
          ),
      },

      {
        path: 'pages',
        loadChildren: () =>
          import('./views/pages/routes').then((m) => m.routes),
      },
    ],
  },
  {
    path: '404',
    loadComponent: () =>
      import('./views/pages/page404/page404.component').then(
        (m) => m.Page404Component
      ),
    data: {
      title: 'Page 404',
    },
  },
  {
    path: '500',
    loadComponent: () =>
      import('./views/pages/page500/page500.component').then(
        (m) => m.Page500Component
      ),
    data: {
      title: 'Page 500',
    },
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./views/pages/login/login.component').then(
        (m) => m.LoginComponent
      ),
    data: {
      title: 'Login Page',
    },
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./views/pages/register/register.component').then(
        (m) => m.RegisterComponent
      ),
    data: {
      title: 'Register Page',
    },
  },
  { path: '**', redirectTo: 'dashboard' },
];
