import { Routes } from '@angular/router';
import { DefaultLayoutComponent } from './layout';
import { AuthGuard } from './guards/auth.guard';
import { SellerAuthGuard } from './guards/seller-auth.guard';
import { AttributeComponent } from './views/attribute/attribute.component';
import { BusinessCategoriesComponent } from './views/bussinessCategories/bussiness-Categories.component';
import { SellerEditComponent } from './views/sellerViews/seller-edit/seller-edit.component';
import { DashboardComponent } from './views/dashboard/dashboard.component';
import { SellerDashboardLayoutComponent } from './layout';

export const routes: Routes = [
  {
    path: 'admin',
    component: DefaultLayoutComponent,
    canActivate: [AuthGuard],
    data: {
      title: 'Home',
    },
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'attributes',
        component: AttributeComponent,
      },
      {
        path: 'bussiness-categories',
        component: BusinessCategoriesComponent,
      },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./views/dashboard/routes').then((m) => m.routes),
      },
      {
        path: 'orders',
        loadChildren: () =>
          import('./views/orders/orders.module').then((m) => m.OrdersModule),
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
      {
        path: 'delivery-men',
        loadChildren: () =>
          import('./views/delivery-men/delivery-men.module').then(
            (m) => m.DeliveryMenModule
          ),
      },
      {
        path: 'banners',
        loadChildren: () =>
          import('./views/banners/banners.module').then((m) => m.BannersModule),
      },
      {
        path: 'coupons',
        loadChildren: () =>
          import('./views/coupons/coupons.module').then((m) => m.CouponsModule),
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
          import('./views/products/product.module').then(
            (m) => m.ProductModule
          ),
      },
      {
        path: 'business-setup',
        canActivate: [AuthGuard],
        loadComponent: () =>
          import('./views/bussinesssetup/business-setup.component').then(
            (m) => m.BusinessSetupComponent
          ),
        data: {
          title: 'Business Setup Page',
        },
      },
      {
        path: 'static-pages',
        loadChildren: () =>
          import('./views/static-pages/staicPages.module').then(
            (m) => m.StaticPagesModule
          ),
      },
      {
        path: 'reviews',
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
      {
        path: 'profile',
        loadChildren: () =>
          import('./views/adminProfile/admin-profile.module').then(
            (m) => m.AdminProfileModule
          ),
        data: {
          title: 'Admin Profile',
        },
      },
      {
        path: 'withdrawal-request',
        loadChildren: () =>
          import('./views/sellerWithdrawal/withdrawal.module').then(m => m.WithdrawalModule),
        // Optional:
        // canActivate: [AuthGuard],
        // data: { title: 'Withdrawal Request' }
      },
      {
        path: 'return-requests',
        loadChildren: () =>
          import('./views/return-request/returnrequest.module').then(m => m.ReturnRequestModule),
      },


      // {
      //   path: 'seller-login',
      //   loadComponent: () =>
      //     import('./views/sellers/seller-login/seller-login.component').then(
      //       (m) => m.SellerLoginComponent
      //     ),
      //   data: {
      //     title: 'Seller Login',
      //   },
      // },
      {
        path: 'seller/edit/:id',
        component: SellerEditComponent,
      },
      {
        path: 'seller-register',
        loadComponent: () =>
          import('./views/sellers/seller-register/seller-register.component').then(
            (m) => m.SellerRegisterComponent
          ),
        data: {
          title: 'Seller Register',
        },
      },
      {
        path: 'transactions',
        loadComponent: () =>
          import('./views/orders/transaction-list/transaction-list.component').then(
            (m) => m.TransactionComponent
          ),
        data: {
          title: 'Transactions',
        },
      },
      {
        path: 'wallet-transactions',
        loadComponent: () =>
          import('./views/wallet-transactions/wallet-transactions.component').then(
            (m) => m.WalletTransactionsComponent
          ),
        data: {
          title: 'Wallet Transactions',
        },
      },
      // {
      //   path: 'seller-products',
      //   loadComponent: () =>
      //     import('./views/sellerProducts/sellerProductList/seller-product-list.component').then(
      //       (m) => m.SellerProductListComponent
      //     ),
      //   data: {
      //     title: 'Seller Product',
      //   },
      // },
      {
        path: 'seller-products',
        loadChildren: () =>
          import('./views/sellerProducts/sellerProduct.module').then(
            (m) => m.SellerProductModule
          ),
      },

    ],
  },


  {
    path: 'seller',
    component: SellerDashboardLayoutComponent,
    canActivate: [SellerAuthGuard],
    data: {
      title: 'Seller Dashboard',
    },
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./seller-views/dashboard/routes').then((m) => m.routes),
      },

      {
        path: 'bank-info',
        loadComponent: () =>
          import('./seller-views/bank-info/bank-info.component').then(
            (m) => m.BankInfoComponent
          ),
        data: {
          title: 'Seller Bank Info',
        },
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./seller-views/seller-profile/seller-profile.component').then(
            (m) => m.SellerProfileComponent
          ),
        data: {
          title: 'Seller Profile',
        },
      },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./seller-views/dashboard/routes').then((m) => m.routes),
      },
      {
        path: 'products',
        loadChildren: () =>
          import('./seller-views/seller-product/product.module').then(
            (m) => m.ProductModule
          ),
        data: {
          title: 'Product List',
        },
      },
      {
        path: 'wallet-transactions',
        loadComponent: () =>
          import('./seller-views/wallet-transactions/wallet-transactions.component').then(
            (m) => m.WalletTransactionsComponent
          ),
        data: {
          title: 'Wallet Transactions',
        },
      },
      {
        path: 'orders',
        loadChildren: () =>
          import('./seller-views/orders/orders.module').then(
            (m) => m.OrdersModule
          ),
        data: {
          title: 'Orders List',
        },
      },
      {
        path: 'transactions',
        loadComponent: () =>
          import('./seller-views/orders/transaction-list/transaction-list.component').then(
            (m) => m.TransactionComponent
          ),
        data: {
          title: 'Transactions',
        },
      },
      {
        path: 'withdrawal-requests',
        loadComponent: () =>
          import('./seller-views/withdrawal/withdrawal-requests/withdrawal-requests.component').then(
            (m) => m.WithdrawalRequestsComponent
          ),
        data: {
          title: 'Withdrawal Requests',
        },
      },
    ],

  },

  // Public Pages
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
    path: 'admin/login',
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
  {
    path: 'seller/login',
    loadComponent: () =>
      import('./seller-views/pages/login/login.component').then(
        (m) => m.SellerLoginComponent
      ),
    data: {
      title: 'Login Page',
    },
  },
  {
    path: 'seller/register',
    loadComponent: () =>
      import('./seller-views/pages/register/register.component').then(
        (m) => m.RegisterComponent
      ),
    data: {
      title: 'Register Page',
    },
  },
  {
    path: '**',
    redirectTo: '/admin/dashboard',
  },
];
