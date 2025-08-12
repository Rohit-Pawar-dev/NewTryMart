import {
  AfterContentInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
} from '@angular/core';
import { getStyle } from '@coreui/utils';
import { RouterLink } from '@angular/router';


import {
  RowComponent,
  ColComponent,
} from '@coreui/angular';

@Component({
  selector: 'app-widgets-dropdown',
  templateUrl: './widgets-dropdown.component.html',
  styleUrls: ['./widgets-dropdown.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default,
  standalone: true,
  imports: [
    RowComponent,
    ColComponent,
    RouterLink,
  ],
})
export class WidgetsDropdownComponent implements OnInit, AfterContentInit {
  constructor(private changeDetectorRef: ChangeDetectorRef) { }

  @Input() userCount: number | null = null;
  @Input() sellerCount: number | null = null;
  @Input() allOrderCount: number | null = null;
  @Input() allProductCount: number | null = null;
  @Input() pendingOrderCount: number | null = null;
  @Input() deliveredOrderCount: number | null = null;
  @Input() cancelledOrderCount: number | null = null;
  @Input() returnOrderCount: number | null = null;
  @Input() shippedOrderCount: number | null = null;
  @Input() confirmedOrderCount: number | null = null;
  @Input() outOfDeliveryCount: number | null = null;
  @Input() packagingOrderCount: number | null = null;
  @Input() walletBalance: number | null = null;
  @Input() totalcommission: number | null = null;
  @Input() totalDeliveryCharges: number | null = null;

  @Output() statusSelected = new EventEmitter<string>();
  orderStats: any[] = [];

  ngOnInit(): void {
    this.orderStats = [
      { title: 'Total Orders', value: this.allOrderCount, icon: 'cil-user', color: 'text-success', key: 'all' },
      { title: 'Pending Orders', value: this.pendingOrderCount, icon: 'cil-clock', color: 'text-warning', key: 'Pending' },
      { title: 'Confirmed Orders', value: this.confirmedOrderCount, icon: 'cil-check-circle', color: 'text-primary', key: 'Confirmed' },
      { title: 'Shipped Orders', value: this.shippedOrderCount, icon: 'cil-truck', color: 'text-info', key: 'Shipped' },
      { title: 'Out of Delivery', value: this.outOfDeliveryCount, icon: 'cil-paper-plane', color: 'text-info', key: 'outOfDelivery' },
      { title: 'Delivered Orders', value: this.deliveredOrderCount, icon: 'cil-envelope-open', color: 'text-secondary', key: 'Delivered' },
      { title: 'Cancelled Orders', value: this.cancelledOrderCount, icon: 'cil-ban', color: 'text-danger', key: 'Cancelled' },
      { title: 'Returned Orders', value: this.returnOrderCount, icon: 'cil-loop-circular', color: 'text-dark', key: 'Returned' },
    ];
  }

  ngAfterContentInit(): void {
    this.changeDetectorRef.detectChanges();
  }

  onStatusClick(status: string): void {
    this.statusSelected.emit(status);
  }
}
