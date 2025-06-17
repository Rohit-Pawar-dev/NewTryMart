import { Routes } from '@angular/router';
import { DeliveryManListComponent } from './delivery-man-list/delivery-man-list.component';
import { DeliveryManAddComponent } from './delivery-man-add/delivery-man-add.component';
import { DeliveryManEditComponent } from './delivery-man-edit/delivery-man-edit.component';
import { DeliveryManViewComponent } from './delivery-man-view/delivery-man-view.component';

export const routes: Routes = [
  {
    path: '',
    component: DeliveryManListComponent,
    data: {
      title: 'Delivery Men'
    }
  },
  {
    path: 'add',
    component: DeliveryManAddComponent,
    data: {
      title: 'Add Delivery Man'
    }
  },
  {
    path: 'edit/:id',
    component: DeliveryManEditComponent,
    data: {
      title: 'Edit Delivery Man'
    }
  },
  {
    path: 'view/:id',
    component: DeliveryManViewComponent,
    data: {
      title: 'View Delivery Man'
    }
  }
];
