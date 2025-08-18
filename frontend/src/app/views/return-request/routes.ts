import { Routes } from '@angular/router';
import { ReturnRequestListComponent } from './return-request-list/return-request-list.component';
import { ReturnRequestViewComponent } from './return-request-view/return-request-view.component';

export const routes: Routes = [
    {
        path: '',
        component: ReturnRequestListComponent,
        data: { title: 'Return Requests List' },
    },
    {
        path: 'view/:id',
        component: ReturnRequestViewComponent,
        data: { title: 'View Return Request' },
    },
];
