import { Component } from '@angular/core';
import { FooterComponent } from '@coreui/angular';

@Component({
  selector: 'app-seller-footer',
  imports: [],
  templateUrl: './seller-footer.component.html',
  styleUrl: './seller-footer.component.scss'
})
export class SellerFooterComponent extends FooterComponent {
  constructor() {
    super();
  }
}
