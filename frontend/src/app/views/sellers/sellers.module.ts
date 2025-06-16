import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { SellerListComponent } from './seller-list/seller-list.component';
import { SellerAddComponent } from './seller-add/seller-add.component';
import { SellerEditComponent } from './seller-edit/seller-edit.component';
import { SellerViewComponent } from './seller-view/seller-view.component';
import { routes } from './routes';

@NgModule({
  declarations: [],
  imports: [
    RouterModule.forChild(routes),
    CommonModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,

    SellerListComponent,
    SellerAddComponent,
    SellerEditComponent,
    SellerViewComponent
  ]
})
export class SellersModule { }
