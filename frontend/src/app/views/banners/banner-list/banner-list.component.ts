import { Component, OnInit } from '@angular/core';
import { BannerService, Banner } from '../../../services/banner.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-banner-list',
  templateUrl: './banner-list.component.html',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
})
export class BannerListComponent implements OnInit {
  banners: Banner[] = [];
  searchTerm = '';
  isLoading = false;

  constructor(private bannerService: BannerService, private router: Router) {}

  ngOnInit() {
    this.loadBanners();
  }

  loadBanners() {
    this.isLoading = true;
    this.bannerService.getBanners({ search: this.searchTerm }).subscribe({
      next: (data) => {
        this.banners = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading banners:', err);
        this.isLoading = false;
      }
    });
  }

  onSearchChange() {
    this.loadBanners();
  }

  deleteBanner(id: string) {
    if (confirm('Are you sure to delete?')) {
      this.bannerService.deleteBanner(id).subscribe(() => this.loadBanners());
    }
  }

  toggleStatus(banner: Banner) {
    const newStatus = banner.status === 'active' ? 'inactive' : 'active';
    this.bannerService.updateBanner(banner._id!, { status: newStatus }).subscribe(() => this.loadBanners());
  }
}
