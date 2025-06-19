import { DOCUMENT, NgStyle } from '@angular/common';
import {
  Component,
  DestroyRef,
  effect,
  inject,
  OnInit,
  Renderer2,
  signal,
  WritableSignal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ChartOptions } from 'chart.js';
import { HttpClient } from '@angular/common/http';
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

// ✅ FIXED: Correct import name for OrderListComponent
import { OrderListComponent } from '../orders/order-list/order-list.component';

@Component({
  templateUrl: 'dashboard.component.html',
  styleUrls: ['dashboard.component.scss'],
  standalone: true,
  imports: [
    OrderListComponent, // ✅ Make sure this is standalone
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
export class DashboardComponent implements OnInit {
  constructor(private http: HttpClient) {}

  readonly #destroyRef: DestroyRef = inject(DestroyRef);
  readonly #document: Document = inject(DOCUMENT);
  readonly #renderer: Renderer2 = inject(Renderer2);
  readonly #chartsData: DashboardChartsData = inject(DashboardChartsData);

  public userCount: number | null = null;
  public sellerCount: number | null = null;
  public allOrderCount: number | null = null;
  public allProductCount: number | null = null;
  public pendingOrderCount: number | null = null;
  public deliveredOrderCount: number | null = null;
  public cancelledOrderCount: number | null = null;
  public returnOrderCount: number | null = null;
  public packagingOrderCount: number | null = null;
  public confirmedOrdeCount: number | null = null;
  public outOfdeliveryCount: number | null = null;

  public mainChart: IChartProps = { type: 'line' };
  public mainChartRef: WritableSignal<any> = signal(undefined);

  #mainChartRefEffect = effect(() => {
    if (this.mainChartRef()) {
      this.setChartStyles();
    }
  });

  public chart: Array<IChartProps> = [];

  public trafficRadioGroup = new FormGroup({
    trafficRadio: new FormControl('Month'),
  });

  ngOnInit(): void {
    this.initCharts();
    this.updateChartOnColorModeChange();
    this.fetchDashboardData();
  }

  initCharts(): void {
    this.mainChart = this.#chartsData.mainChart;
  }

  setTrafficPeriod(value: string): void {
    this.trafficRadioGroup.setValue({ trafficRadio: value });
    this.#chartsData.initMainChart(value);
    this.initCharts();
  }

  handleChartRef($chartRef: any) {
    if ($chartRef) {
      this.mainChartRef.set($chartRef);
    }
  }

  updateChartOnColorModeChange() {
    const unListen = this.#renderer.listen(
      this.#document.documentElement,
      'ColorSchemeChange',
      () => {
        this.setChartStyles();
      }
    );

    this.#destroyRef.onDestroy(() => {
      unListen();
    });
  }

  setChartStyles() {
    if (this.mainChartRef()) {
      setTimeout(() => {
        const options: ChartOptions = { ...this.mainChart.options };
        const scales = this.#chartsData.getScales();
        this.mainChartRef().options.scales = { ...options.scales, ...scales };
        this.mainChartRef().update();
      });
    }
  }

  fetchDashboardData(): void {
    const apiUrl = `${environment.apiUrl}/dashboard`;

    this.http.get<any>(apiUrl).subscribe({
      next: (res) => {
        const data = res?.data ?? {};

        this.userCount = data.users?.total ?? 0;
        this.sellerCount = data.sellers?.total ?? 0;

        this.allOrderCount = data.orders?.total ?? 0;
        this.allProductCount = data.orders?.total ??0;
        this.pendingOrderCount = data.orders?.pending ?? 0;
        this.deliveredOrderCount = data.orders?.delivered ?? 0;
        this.cancelledOrderCount = data.orders?.cancelled ?? 0;

        this.returnOrderCount = data.orders?.returned ?? 0;
        this.packagingOrderCount = data.orders?.packaging ?? 0;
        this.confirmedOrdeCount = data.orders?.confirmed ?? 0;
        this.outOfdeliveryCount = data.orders?.outForDelivery ?? 0;

        console.log('Dashboard Data:', data);
      },
      error: (err) => {
        console.error('Failed to load dashboard data', err);
        this.userCount = null;
        this.sellerCount = null;
        this.allOrderCount = null;
        this.allProductCount = null;
        this.pendingOrderCount = null;
        this.deliveredOrderCount = null;
        this.cancelledOrderCount = null;
        this.returnOrderCount = null;
        this.packagingOrderCount = null;
        this.confirmedOrdeCount = null;
        this.outOfdeliveryCount = null;
      },
    });
  }
}
