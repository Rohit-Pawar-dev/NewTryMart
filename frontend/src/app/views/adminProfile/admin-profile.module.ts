import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

// Import your admin profile component(s)
import { AdminProfileComponent } from './admin-profile.component';

// Define routes for this module
const routes: Routes = [
  {
    path: '',
    component: AdminProfileComponent
  }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),

    AdminProfileComponent // standalone component
  ]
})
export class AdminProfileModule {}
