import { Component, OnInit } from '@angular/core';
import { SellerService, Seller } from '../../../services/seller.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import Swal from 'sweetalert2';

@Component({
  standalone: true,
  selector: 'app-seller-list',
  templateUrl: './seller-list.component.html',
  imports: [CommonModule, RouterModule, FormsModule],
})
export class SellerListComponent implements OnInit {
  sellers: any[] = [];
  isLoading = true;

  searchTerm = '';
  page = 1;
  pageSize = 10;
  totalPages = 0;

  constructor(private sellerService: SellerService) {}

  ngOnInit(): void {
    this.loadSellers();
  }

  loadSellers(): void {
    this.isLoading = true;
    this.sellerService.getSellers(this.searchTerm, this.page, this.pageSize).subscribe({
      next: (res) => {
        this.sellers = res.data;
        this.totalPages = res.totalPages;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading sellers:', err);
        this.isLoading = false;
      }
    });
  }

  onSearchChange(): void {
    this.page = 1;
    this.loadSellers();
  }

  goToPage(p: number): void {
    if (p >= 1 && p <= this.totalPages) {
      this.page = p;
      this.loadSellers();
    }
  }

  deleteSeller(sellerId: string): void {
    Swal.fire({
      title: 'Delete Seller?',
      text: 'Are you sure you want to delete this seller?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        this.sellerService.deleteSeller(sellerId).subscribe({
          next: () => {
            this.sellers = this.sellers.filter(seller => seller._id !== sellerId);
            Swal.fire('Deleted!', 'Seller has been deleted.', 'success');
          },
          error: (err) => {
            console.error('Error deleting seller:', err);
            Swal.fire('Error', 'Failed to delete seller.', 'error');
          }
        });
      }
    });
  }

  toggleStatus(seller: Seller): void {
    const newStatus = seller.status === 'active' ? 'inactive' : 'active';
    this.sellerService.updateSeller(seller._id!, { status: newStatus }).subscribe({
      next: () => {
        seller.status = newStatus;
        Swal.fire('Updated!', `Seller status changed to ${newStatus}.`, 'success');
      },
      error: (err) => {
        console.error('Error updating status:', err);
        Swal.fire('Error', 'Failed to update seller status.', 'error');
      }
    });
  }
}
