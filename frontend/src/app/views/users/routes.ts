import { Routes } from '@angular/router';
import { UserListComponent } from './user-list/user-list.component';
import { UserAddComponent } from './user-add/user-add.component';
import { UserEditComponent } from './user-edit/user-edit.component';
import { UserViewComponent } from './user-view/user-view.component';

export const routes: Routes = [
  {
    path: '',
    component: UserListComponent,
    data: {
      title: 'Users'
    }
  },
  {
    path: 'add',
    component: UserAddComponent,
    data: {
      title: 'Add User'
    }
  },
  {
    path: 'edit/:id',
    component: UserEditComponent,
    data: {
      title: 'Edit User'
    }
  },
  {
    path: 'view/:id',
    component: UserViewComponent,
    data: {
      title: 'View User'
    }
  }
];