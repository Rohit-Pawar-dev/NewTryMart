import {
  AfterContentInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { RowComponent, ColComponent } from '@coreui/angular';

@Component({
  selector: 'app-widgets-dropdown',
  templateUrl: './widgets-dropdown.component.html',
  styleUrls: ['./widgets-dropdown.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default,
  standalone: true,
  imports: [RowComponent, ColComponent, RouterLink],
})
export class WidgetsDropdownComponent implements OnInit, AfterContentInit {
  constructor(private changeDetectorRef: ChangeDetectorRef) {}

  @Input() allProductCount: number | null = null;
  @Input() totalEarnings: number | null = null;
  @Input() allOrderCount: number | null = null;
  @Input() pendingOrderCount: number | null = null;
  @Input() confirmedOrderCount: number | null = null;
  @Input() shippedOrderCount: number | null = null;
  @Input() deliveredOrderCount: number | null = null;
  @Input() cancelledOrderCount: number | null = null;
  @Input() returnOrderCount: number | null = null;
  @Input() outOfDeliveryCount: number | null = null;

  @Output() statusSelected = new EventEmitter<string>();

  ngOnInit(): void {}

  ngAfterContentInit(): void {
    this.changeDetectorRef.detectChanges();
  }

  onStatusClick(status: string): void {
    this.statusSelected.emit(status);
  }
}
