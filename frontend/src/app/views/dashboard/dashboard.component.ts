import { DOCUMENT, NgStyle } from '@angular/common';
import {
  Component,
  DestroyRef,
  OnInit,
  Renderer2,
  ViewChild,
  ElementRef,
  inject,
  signal,
  WritableSignal,
  effect,
  AfterViewInit,
  ChangeDetectorRef,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../environments/environment';

import {
  AvatarComponent,
  ButtonDirective,
  ButtonGroupComponent,
  CardBodyComponent,
  CardComponent,
  CardFooterComponent,
  CardHeaderComponent,
  ColComponent,
  FormCheckLabelDirective,
  GutterDirective,
  ProgressBarDirective,
  ProgressComponent,
  RowComponent,
  TableDirective,
  TextColorDirective,
} from '@coreui/angular';

import { ChartjsComponent } from '@coreui/angular-chartjs';
import { IconDirective } from '@coreui/icons-angular';

import { WidgetsBrandComponent } from '../widgets/widgets-brand/widgets-brand.component';
import { WidgetsDropdownComponent } from '../widgets/widgets-dropdown/widgets-dropdown.component';
import { DashboardChartsData, IChartProps } from './dashboard-charts-data';
import { OrderListComponent } from '../orders/order-list/order-list.component';

@Component({
  templateUrl: 'dashboard.component.html',
  styleUrls: ['dashboard.component.scss'],
  standalone: true,
  imports: [
    OrderListComponent,
    WidgetsDropdownComponent,
    TextColorDirective,
    CardComponent,
    CardBodyComponent,
    RowComponent,
    ColComponent,
    ButtonDirective,
    IconDirective,
    ReactiveFormsModule,
    ButtonGroupComponent,
    FormCheckLabelDirective,
    ChartjsComponent,
    NgStyle,
    CardFooterComponent,
    GutterDirective,
    ProgressBarDirective,
    ProgressComponent,
    WidgetsBrandComponent,
    CardHeaderComponent,
    TableDirective,
    AvatarComponent,
  ],
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('orderListSection') orderListSection!: ElementRef;

  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly renderer = inject(Renderer2);
  private readonly chartsData = inject(DashboardChartsData);

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  // Dashboard counts
  userCount: number | null = null;
  sellerCount: number | null = null;
  allOrderCount: number | null = null;
  allProductCount: number | null = null;
  pendingOrderCount: number | null = null;
  confirmedOrderCount: number | null = null;
  packagingOrderCount: number | null = null;
  shippedOrderCount: number | null = null;
  deliveredOrderCount: number | null = null;
  cancelledOrderCount: number | null = null;
  returnOrderCount: number | null = null;
  outOfDeliveryCount: number | null = null;

  // Chart
  mainChart: IChartProps = { type: 'line' };
  mainChartRef: WritableSignal<any> = signal(undefined);

  selectedStatus: string = 'all';

  trafficRadioGroup = new FormGroup({
    trafficRadio: new FormControl('Month'),
  });

  private chartEffect = effect(() => {
    if (this.mainChartRef()) {
      this.setChartStyles();
    }
  });

  ngOnInit(): void {
    this.initCharts();
    this.handleColorSchemeChange();
    this.fetchDashboardData();

    this.route.queryParamMap.subscribe((params) => {
      const statusParam = params.get('status');
      this.selectedStatus = statusParam ? statusParam : 'all';
    });
  }

  ngAfterViewInit(): void {
    this.cdr.detectChanges(); // ensure ViewChild is available after init
  }

  initCharts(): void {
    this.mainChart = this.chartsData.mainChart;
  }

  handleChartRef(chartRef: any): void {
    if (chartRef) {
      this.mainChartRef.set(chartRef);
    }
  }

  setTrafficPeriod(value: string): void {
    this.trafficRadioGroup.setValue({ trafficRadio: value });
    this.chartsData.initMainChart(value);
    this.initCharts();
  }

  handleColorSchemeChange(): void {
    const unlisten = this.renderer.listen(
      this.document.documentElement,
      'ColorSchemeChange',
      () => this.setChartStyles()
    );
    this.destroyRef.onDestroy(() => unlisten());
  }

  setChartStyles(): void {
    if (this.mainChartRef()) {
      setTimeout(() => {
        const chart = this.mainChartRef();
        const newScales = this.chartsData.getScales();
        chart.options.scales = { ...chart.options.scales, ...newScales };
        chart.update();
      });
    }
  }

  fetchDashboardData(): void {
    const url = `${environment.apiUrl}/dashboard`;

    this.http.get<any>(url).subscribe({
      next: (res) => {
        const data = res?.data ?? {};
        const orders = data.orders ?? {};

        this.userCount = data.users?.total ?? 0;
        this.sellerCount = data.sellers?.total ?? 0;
        this.allOrderCount = orders.total ?? 0;
        this.allProductCount = data.products?.total ?? 0;

        this.pendingOrderCount = orders.pending ?? 0;
        this.confirmedOrderCount = orders.confirmed ?? 0;
        this.packagingOrderCount = orders.processing ?? 0;
        this.shippedOrderCount = orders.shipped ?? 0;
        this.deliveredOrderCount = orders.delivered ?? 0;
        this.cancelledOrderCount = orders.cancelled ?? 0;
        this.returnOrderCount = orders.returned ?? 0;
        this.outOfDeliveryCount = orders.outForDelivery ?? 0;
      },
      error: (err) => {
        console.error('Failed to load dashboard data:', err);
        this.resetCounts();
      },
    });
  }

  resetCounts(): void {
    this.userCount =
      this.sellerCount =
      this.allOrderCount =
      this.allProductCount =
      this.pendingOrderCount =
      this.confirmedOrderCount =
      this.packagingOrderCount =
      this.shippedOrderCount =
      this.deliveredOrderCount =
      this.cancelledOrderCount =
      this.returnOrderCount =
      this.outOfDeliveryCount =
        null;
  }

  /**
   * Called when a status widget or dropdown emits a status selection.
   */
  onStatusFilter(status: string): void {
    this.selectedStatus = status;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { status: status === 'all' ? null : status },
      queryParamsHandling: 'merge',
    });

    // Wait for navigation and DOM update
    setTimeout(() => {
      if (this.orderListSection?.nativeElement) {
        this.orderListSection.nativeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    }, 100);
  }
}
