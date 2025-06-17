import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DeliveryManService, DeliveryMan } from '../../../services/delivery-man.service';

@Component({
  standalone: true,
  selector: 'app-delivery-man-view',
  templateUrl: './delivery-man-view.component.html',
  imports: [CommonModule]
})
export class DeliveryManViewComponent implements OnInit {
  deliveryMan: DeliveryMan | null = null;
  deliveryManId: string | null = null;
  isLoading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private deliveryManService: DeliveryManService
  ) {}

  ngOnInit(): void {
    this.deliveryManId = this.route.snapshot.paramMap.get('id');
    if (this.deliveryManId) {
      this.deliveryManService.getDeliveryMan(this.deliveryManId).subscribe({
        next: (data) => {
          this.deliveryMan = data;
          this.isLoading = false;
        },
        error: () => {
          this.error = 'Delivery man not found or failed to fetch.';
          this.isLoading = false;
        }
      });
    } else {
      this.error = 'Invalid delivery man ID.';
      this.isLoading = false;
    }
  }
}
