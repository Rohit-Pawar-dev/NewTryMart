// seller-list.component.ts
import { Component, OnInit } from '@angular/core';
import { SellerService, Seller } from '../../../services/seller.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

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
    if (confirm('Are you sure you want to delete this seller?')) {
      this.sellerService.deleteSeller(sellerId).subscribe({
        next: () => {
          this.sellers = this.sellers.filter(seller => seller._id !== sellerId);
        },
        error: (err) => {
          console.error('Error deleting seller:', err);
        }
      });
    }
  }

  toggleStatus(seller: Seller): void {
    const newStatus = seller.status === 'active' ? 'inactive' : 'active';
    this.sellerService.updateSeller(seller._id!, { status: newStatus }).subscribe({
      next: () => {
        seller.status = newStatus;
      },
      error: (err) => {
        console.error('Error updating status:', err);
      }
    });
  }
}
