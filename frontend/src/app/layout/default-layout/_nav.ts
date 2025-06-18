import { INavData } from '@coreui/angular';

export const navItems: INavData[] = [
  {
    name: 'Dashboard',
    url: '/dashboard',
    iconComponent: { name: 'cil-speedometer' },
    badge: {
      color: 'info',
      text: '',
    },
  },

  {
    title: true,
    name: 'Order Management',
  },
  {
    name: 'Orders',
    url: '/orders',
    iconComponent: { name: 'cil-tags' },
  },

  {
    title: true,
    name: 'Product management',
  },
  {
    name: 'Categories',
    url: '/categories',
    iconComponent: { name: 'cil-tags' },
  },
  {
    name: 'SubCategories',
    url: '/sub-categories',
    iconComponent: { name: 'cil-tags' },
  },
 {
    name: 'Products',
    url: '/products',
    iconComponent: { name: 'cil-tags' },
  },
  {
    title: true,
    name: 'Promotion management',
  },
  {
    name: 'Banners',
    url: '/banners',
    iconComponent: { name: 'cil-bell' },
  },
  {
    name: 'Coupons',
    url: '/coupons',
    iconComponent: { name: 'cil-bell' },
  },

  {
    title: true,
    name: 'User management',
  },
  {
    name: 'Users',
    url: '/users',
    iconComponent: { name: 'cil-user' },
  },
  {
    name: 'Sellers',
    url: '/sellers',
    iconComponent: { name: 'cil-user' },
  },

  {
    name: 'Review',
    url: '/reviews',
    iconComponent: { name: 'cil-star' },
  },
{
    title: true,
    name: 'System Settings',
  },
   {
  name: 'Business Setup',
  url: '/business-setup',
  iconComponent: { name: 'cil-star' }
},


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
