// dashboard.component.ts
import { DOCUMENT, NgStyle } from '@angular/common';
import {
  Component, DestroyRef, OnInit, Renderer2, ViewChild, ElementRef,
  inject, signal, WritableSignal, effect, AfterViewInit, ChangeDetectorRef,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../environments/environment';
// import { Input } from '@angular/core';

import {
  AvatarComponent, ButtonDirective, ButtonGroupComponent, CardBodyComponent,
  CardComponent, CardFooterComponent, CardHeaderComponent, ColComponent,
  FormCheckLabelDirective, GutterDirective, ProgressBarDirective,
  ProgressComponent, RowComponent, TableDirective, TextColorDirective,
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
    OrderListComponent, WidgetsDropdownComponent, TextColorDirective,
    CardComponent, CardBodyComponent, RowComponent, ColComponent,
    ButtonDirective, IconDirective, ReactiveFormsModule, ButtonGroupComponent,
    FormCheckLabelDirective, ChartjsComponent, NgStyle, CardFooterComponent,
    GutterDirective, ProgressBarDirective, ProgressComponent,
    WidgetsBrandComponent, CardHeaderComponent, TableDirective, AvatarComponent,
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
  ) { }

  // Dashboard counts
  dashboardCounts = {
    userCount: null,
    sellerCount: null,
    allOrderCount: null,
    allProductCount: null,
    pendingOrderCount: null,
    confirmedOrderCount: null,
    packagingOrderCount: null,
    shippedOrderCount: null,
    deliveredOrderCount: null,
    cancelledOrderCount: null,
    returnOrderCount: null,
    outOfDeliveryCount: null,
    walletBalance:null,
    totalcommission:null ,
    totalDeliveryCharges:null,


  };

  selectedStatus: string = 'all';
  trafficRadioGroup = new FormGroup({
    trafficRadio: new FormControl('Month'),
  });

  // Chart
  mainChart: IChartProps = { type: 'line' };
  mainChartRef: WritableSignal<any> = signal(undefined);

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
      this.selectedStatus = statusParam ?? 'all';
    });
  }

  ngAfterViewInit(): void {
    this.cdr.detectChanges();
  }

  initCharts(): void {
    this.mainChart = this.chartsData.mainChart;
  }

  handleChartRef(chartRef: any): void {
    if (chartRef) this.mainChartRef.set(chartRef);
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
        chart.options.scales = {
          ...chart.options.scales,
          ...this.chartsData.getScales(),
        };
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
        this.dashboardCounts = {
          userCount: data.users?.total ?? 0,
          sellerCount: data.sellers?.total ?? 0,
          allOrderCount: orders.total ?? 0,
          allProductCount: data.products?.total ?? 0,
          pendingOrderCount: orders.pending ?? 0,
          confirmedOrderCount: orders.confirmed ?? 0,
          packagingOrderCount: orders.processing ?? 0,
          shippedOrderCount: orders.shipped ?? 0,
          deliveredOrderCount: orders.delivered ?? 0,
          cancelledOrderCount: orders.cancelled ?? 0,
          returnOrderCount: orders.returned ?? 0,
          outOfDeliveryCount: orders.outForDelivery ?? 0,
          walletBalance: orders.admin_wallet_balance ?? 0,
          totalcommission : orders.seller_commission_collected ?? 0,
          totalDeliveryCharges: orders.delivery_charges_collected??0,
        };
      },
      error: (err) => {
        console.error('Dashboard data error:', err);
        Object.keys(this.dashboardCounts).forEach(
          (key) => (this.dashboardCounts[key as keyof typeof this.dashboardCounts] = null)
        );
      },
    });
  }

  onStatusFilter(status: string): void {
    this.selectedStatus = status;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { status: status === 'all' ? null : status },
      queryParamsHandling: 'merge',
    });

    setTimeout(() => {
      this.orderListSection?.nativeElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }
}
