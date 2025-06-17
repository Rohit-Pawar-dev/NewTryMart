import { Component, OnInit } from '@angular/core';
import { DeliveryManService, DeliveryMan } from '../../../services/delivery-man.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-delivery-man-list',
  templateUrl: './delivery-man-list.component.html',
  imports: [CommonModule, RouterModule, FormsModule],
})
export class DeliveryManListComponent implements OnInit {
  deliveryMen: DeliveryMan[] = [];
  isLoading = true;

  searchTerm = '';
  page = 1;
  pageSize = 10;
  totalPages = 0;

  constructor(private deliveryManService: DeliveryManService) {}

  ngOnInit(): void {
    this.loadDeliveryMen();
  }

  loadDeliveryMen(): void {
    this.isLoading = true;
    this.deliveryManService.getDeliveryMen(this.searchTerm, this.page, this.pageSize).subscribe({
      next: (res) => {
        this.deliveryMen = res.data;
        this.totalPages = res.totalPages;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading delivery men:', err);
        this.isLoading = false;
      }
    });
  }

  onSearchChange(): void {
    this.page = 1;
    this.loadDeliveryMen();
  }

  goToPage(p: number): void {
    if (p >= 1 && p <= this.totalPages) {
      this.page = p;
      this.loadDeliveryMen();
    }
  }

  deleteDeliveryMan(id: string): void {
    if (confirm('Are you sure you want to delete this delivery man?')) {
      this.deliveryManService.deleteDeliveryMan(id).subscribe({
        next: () => {
          this.deliveryMen = this.deliveryMen.filter(d => d._id !== id);
        },
        error: (err) => {
          console.error('Error deleting delivery man:', err);
        }
      });
    }
  }

  toggleStatus(deliveryMan: DeliveryMan): void {
    const newStatus = deliveryMan.status === 'active' ? 'inactive' : 'active';
    this.deliveryManService.updateDeliveryMan(deliveryMan._id!, { status: newStatus }).subscribe({
      next: () => {
        deliveryMan.status = newStatus;
      },
      error: (err) => {
        console.error('Error updating status:', err);
      }
    });
  }
}
