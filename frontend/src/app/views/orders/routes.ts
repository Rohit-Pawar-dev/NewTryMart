import { Routes } from '@angular/router';
import { OrderListComponent } from './order-list/order-list.component';
import { OrderViewComponent } from './order-view/order-view.component';
import { OrderInvoiceComponent } from './order-invoice/order-invoice.component';

export const routes: Routes = [
  {
    path: '',
    component: OrderListComponent,
    data: { title: 'Order List' },
  },
  {
    path: ':id',
    component: OrderViewComponent,
    data: { title: 'View Order' },
  },
  {
    path: 'invoice/:id',
    component: OrderInvoiceComponent,
    data: { title: 'Invoice' },
  }

];
