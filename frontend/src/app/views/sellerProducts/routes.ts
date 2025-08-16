import { Routes } from '@angular/router';
import { SellerProductListComponent } from './sellerProductList/seller-product-list.component';
import { SellerProductViewComponent } from './seller-product-view/seller-product-view.component';

export const routes: Routes = [
    {
        path: '',
        component: SellerProductListComponent,
        data: { title: ' Seller Product List' },
    },
    //   {
    //     path: 'add',
    //     component: ProductAddComponent,
    //     data: { title: 'Add Product' },
    //   },
    //   {
    //     path: 'edit/:id',
    //     component: ProductEditComponent,
    //     data: { title: 'Edit Product' },
    //   },
    {
        path: 'view/:id',
        component: SellerProductViewComponent,
        data: { title: 'Seller View Product' },
    },
];
