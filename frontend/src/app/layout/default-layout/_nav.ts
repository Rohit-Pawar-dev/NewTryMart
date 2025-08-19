import { INavData } from '@coreui/angular';

export const navItems: INavData[] = [
  {
    name: 'Dashboard',
    url: '/admin/dashboard',
    icon: 'fas fa-tachometer-alt'
  },

  {
    title: true,
    name: 'Order Management',
  },
  {
    name: 'Orders',
    url: '/admin/orders',
    icon: 'fas fa-shopping-cart'
  },

  {
    title: true,
    name: 'Transaction Management',
  },
  {
    name: 'Transactions',
    url: '/admin/transactions',
    icon: 'fas fa-credit-card'
  },
    {
    name: 'Wallet Transaction ',
    url: '/admin/wallet-transactions',
    icon: 'fas fa-credit-card'
  },
  {
    title: true,
    name: 'Product management',
  },
  {
    name: 'Categories',
    url: '/admin/categories',
    icon: 'fas fa-stream'
  },
  {
    name: 'SubCategories',
    url: '/admin/sub-categories',
    icon: 'fas fa-sitemap'
  },
  {
    name: 'Attributes',
    url: '/admin/attributes',
    icon: 'fas fa-sliders-h'
  },
  {
    name: 'Products',
    url: '/admin/products',
    icon: 'fas fa-box-open'
  },

  {
    name: 'Seller Products',
    url: '/admin/seller-products',
    icon: 'fas fa-store'
  },
  {
    title: true,
    name: 'Advertisement management',
  },
  {
    name: 'Banners',
    url: '/admin/banners',
    icon: 'fas fa-image'
  },
  {
    name: 'Coupons',
    url: '/admin/coupons',
    icon: 'fas fa-percentage'
  },

  {
    title: true,
    name: 'User management',
  },
  {
    name: 'Users',
    url: '/admin/users',
    icon: 'fas fa-users'
  },
  {
    name: 'Return Requests',
    url: '/admin/return-requests',
    icon: 'fas fa-sitemap'
  },


  {
    name: 'Review',
    url: '/admin/reviews',
    icon: 'fas fa-star'
  },
  {
    title: true,
    name: 'Seller management',
  },
  {
    name: 'Sellers',
    url: '/admin/sellers',
    icon: 'fas fa-user-tie'
  },


  {
    name: 'Withdrawal Requests',
    url: '/admin/withdrawal-request',
    icon: 'fas fa-stream'

  },
  {
    name: 'Bussiness Categories',
    url: '/admin/bussiness-categories',
    icon: 'fas fa-stream'

  },
  {
    title: true,
    name: 'System Settings',
  },
  {
    name: 'Business Setup',
    url: '/admin/business-setup',
    icon: 'fas fa-briefcase'
  },
  {
    name: 'Static Pages',
    url: '/admin/static-pages',
    icon: 'fas fa-file-alt'
  },
  //  {
  //   title: true,
  //   name: 'Seller Management',
  // },
  // {
  //   name: 'Seller SignIn',
  //   url: '/seller-login',
  //   iconComponent: { name: 'cil-star' },
  // },
  // {
  //   name: 'Seller SignUp',
  //   url: '/seller-register',
  //   iconComponent: { name: 'cil-star' },
  // },


  // {
  //   title: true,
  //   name: 'System settings',
  // },
  // {

  // {
  //   name: 'Delivery Men',
  //   url: '/delivery-men',
  //   iconComponent: { name: 'cil-user' },
  // },

  // {
  //   name: 'Pages',
  //   url: '/login',
  //   iconComponent: { name: 'cil-star' },
  //   children: [
  //     {
  //       name: 'Login',
  //       url: '/login',
  //       icon: 'nav-icon-bullet',
  //     },
  //     {
  //       name: 'Register',
  //       url: '/register',
  //       icon: 'nav-icon-bullet',
  //     },
  //     {
  //       name: 'Error 404',
  //       url: '/404',
  //       icon: 'nav-icon-bullet',
  //     },
  //     {
  //       name: 'Error 500',
  //       url: '/500',
  //       icon: 'nav-icon-bullet',
  //     },
  //   ],
  // },
  // {
  //   title: true,
  //   name: 'Links',
  //   class: 'mt-auto',
  // },
  // {
  //   name: 'Docs',
  //   url: 'https://coreui.io/angular/docs/',
  //   iconComponent: { name: 'cil-description' },
  //   attributes: { target: '_blank' },
  // },
];

// import { INavData } from '@coreui/angular';

// export const navItems: INavData[] = [
//   {
//     name: 'Dashboard',
//     url: '/dashboard',
//     iconComponent: { name: 'cil-speedometer' },
//     badge: {
//       color: 'info',
//       text: '',
//     },
//   },

//   {
//     name: 'Banners',
//     url: '/banners',
//     iconComponent: { name: 'cil-bell' },
//   },

//   {
//     name: 'Coupons',
//     url: '/coupons',
//     iconComponent: { name: 'cil-bell' },
//   },

//   {
//     name: 'Categories',
//     url: '/categories',
//     iconComponent: { name: 'cil-tags' },
//   },

//   {
//     name: 'SubCategories',
//     url: '/sub-categories',
//     iconComponent: { name: 'cil-tags' },
//   },

//   {
//     name: 'Users',
//     url: '/users',
//     iconComponent: { name: 'cil-user' },
//   },

//   {
//     name: 'Sellers',
//     url: '/sellers',
//     iconComponent: { name: 'cil-user' },
//   },

//   // {
//   //   name: 'Delivery Men',
//   //   url: '/delivery-men',
//   //   iconComponent: { name: 'cil-user' },
//   // },

//   // {
//   //   name: 'Pages',
//   //   url: '/login',
//   //   iconComponent: { name: 'cil-star' },
//   //   children: [
//   //     {
//   //       name: 'Login',
//   //       url: '/login',
//   //       icon: 'nav-icon-bullet',
//   //     },
//   //     {
//   //       name: 'Register',
//   //       url: '/register',
//   //       icon: 'nav-icon-bullet',
//   //     },
//   //     {
//   //       name: 'Error 404',
//   //       url: '/404',
//   //       icon: 'nav-icon-bullet',
//   //     },
//   //     {
//   //       name: 'Error 500',
//   //       url: '/500',
//   //       icon: 'nav-icon-bullet',
//   //     },
//   //   ],
//   // },
//   // {
//   //   title: true,
//   //   name: 'Links',
//   //   class: 'mt-auto',
//   // },
//   // {
//   //   name: 'Docs',
//   //   url: 'https://coreui.io/angular/docs/',
//   //   iconComponent: { name: 'cil-description' },
//   //   attributes: { target: '_blank' },
//   // },
// ];
