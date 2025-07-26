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

  data: any[] = [];
  options: any[] = [];

  labels = [
    'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December', 'January', 'February', 'March', 'April',
  ];

  datasets = [
    [
      {
        label: 'My First dataset',
        backgroundColor: 'transparent',
        borderColor: 'rgba(255,255,255,.55)',
        pointBackgroundColor: getStyle('--cui-primary'),
        pointHoverBorderColor: getStyle('--cui-primary'),
        data: [65, 59, 84, 84, 51, 55, 40],
      },
    ],
    [
      {
        label: 'My Second dataset',
        backgroundColor: 'transparent',
        borderColor: 'rgba(255,255,255,.55)',
        pointBackgroundColor: getStyle('--cui-info'),
        pointHoverBorderColor: getStyle('--cui-info'),
        data: [1, 18, 9, 17, 34, 22, 11],
      },
    ],
    [
      {
        label: 'My Third dataset',
        backgroundColor: 'rgba(255,255,255,.2)',
        borderColor: 'rgba(255,255,255,.55)',
        pointBackgroundColor: getStyle('--cui-warning'),
        pointHoverBorderColor: getStyle('--cui-warning'),
        data: [78, 81, 80, 45, 34, 12, 40],
        fill: true,
      },
    ],
    [
      {
        label: 'My Fourth dataset',
        backgroundColor: 'rgba(255,255,255,.2)',
        borderColor: 'rgba(255,255,255,.55)',
        data: [78, 81, 80, 45, 34, 12, 40, 85, 65, 23, 12, 98, 34, 84, 67, 82],
        barPercentage: 0.7,
      },
    ],
  ];

  optionsDefault = {
    plugins: {
      legend: {
        display: false,
      },
    },
    maintainAspectRatio: false,
    scales: {
      x: {
        border: { display: false },
        grid: { display: false, drawBorder: false },
        ticks: { display: false },
      },
      y: {
        min: 30,
        max: 89,
        display: false,
        grid: { display: false },
        ticks: { display: false },
      },
    },
    elements: {
      line: { borderWidth: 1, tension: 0.4 },
      point: { radius: 4, hitRadius: 10, hoverRadius: 4 },
    },
  };

  orderStats: any[] = [];

  ngOnInit(): void {
    this.setData();
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

  setData(): void {
    this.data = [];
    for (let idx = 0; idx < 4; idx++) {
      this.data[idx] = {
        labels: idx < 3 ? this.labels.slice(0, 7) : this.labels,
        datasets: this.datasets[idx],
      };
    }
    this.setOptions();
  }

  setOptions(): void {
    this.options = [];
    for (let idx = 0; idx < 4; idx++) {
      const options = JSON.parse(JSON.stringify(this.optionsDefault));
      switch (idx) {
        case 0:
          this.options.push(options);
          break;
        case 1:
          options.scales.y.min = -9;
          options.scales.y.max = 39;
          options.elements.line.tension = 0;
          this.options.push(options);
          break;
        case 2:
          options.scales.x = { display: false };
          options.scales.y = { display: false };
          options.elements.line.borderWidth = 2;
          options.elements.point.radius = 0;
          this.options.push(options);
          break;
        case 3:
          options.scales.x.grid = { display: false, drawTicks: false, drawBorder: false };
          options.scales.y.min = undefined;
          options.scales.y.max = undefined;
          options.elements = {};
          this.options.push(options);
          break;
      }
    }
  }

  /**
   * Emits the selected status when any status widget is clicked.
   * You can bind this to status boxes in the HTML template.
   */
  onStatusClick(status: string): void {
    this.statusSelected.emit(status);
  }
}
