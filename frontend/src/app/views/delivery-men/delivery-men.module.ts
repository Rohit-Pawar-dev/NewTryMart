import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { DeliveryManListComponent } from './delivery-man-list/delivery-man-list.component';
import { DeliveryManAddComponent } from './delivery-man-add/delivery-man-add.component';
import { DeliveryManEditComponent } from './delivery-man-edit/delivery-man-edit.component';
import { DeliveryManViewComponent } from './delivery-man-view/delivery-man-view.component';
import { routes } from './routes';

@NgModule({
  declarations: [],
  imports: [
    RouterModule.forChild(routes),
    CommonModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,

    DeliveryManListComponent,
    DeliveryManAddComponent,
    DeliveryManEditComponent,
    DeliveryManViewComponent
  ]
})
export class DeliveryMenModule { }
