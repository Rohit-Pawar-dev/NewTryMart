import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SellerService, Seller } from '../../../services/seller.service';

@Component({
  standalone: true,
  selector: 'app-seller-view',
  templateUrl: './seller-view.component.html',
  imports: [CommonModule]
})
export class SellerViewComponent implements OnInit {
  seller: Seller | null = null;
  sellerId: string | null = null;
  isLoading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private sellerService: SellerService
  ) {}

  ngOnInit(): void {
    this.sellerId = this.route.snapshot.paramMap.get('id');
    if (this.sellerId) {
      this.sellerService.getSeller(this.sellerId).subscribe({
        next: (sellerData) => {
          this.seller = sellerData;
          this.isLoading = false;
        },
        error: () => {
          this.error = 'Seller not found or failed to fetch.';
          this.isLoading = false;
        }
      });
    } else {
      this.error = 'Invalid seller ID.';
      this.isLoading = false;
    }
  }
}
