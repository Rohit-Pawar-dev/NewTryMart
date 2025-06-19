import { Component, OnInit } from '@angular/core';
import { BannerService, Banner } from '../../../services/banner.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

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

  bannerTypeMap: { [key: string]: string } = {
  main_banner: 'Main Banner',
  popup_banner: 'Popup Banner',
  ads_img_banner: 'Advertisement Image',
  ads_video_banner: 'Advertisement Video'
};


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
        Swal.fire('Error', 'Failed to load banners', 'error');
      }
    });
  }

  onSearchChange() {
    this.loadBanners();
  }

  deleteBanner(id: string) {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This action cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.bannerService.deleteBanner(id).subscribe({
          next: () => {
            Swal.fire('Deleted!', 'Banner has been deleted.', 'success');
            this.loadBanners();
          },
          error: () => {
            Swal.fire('Error', 'Failed to delete banner', 'error');
          }
        });
      }
    });
  }

  toggleStatus(banner: Banner) {
    const newStatus = banner.status === 'active' ? 'inactive' : 'active';
    this.bannerService.updateBanner(banner._id!, { status: newStatus }).subscribe({
      next: () => {
        Swal.fire('Updated', `Status changed to ${newStatus}`, 'success');
        this.loadBanners();
      },
      error: () => {
        Swal.fire('Error', 'Failed to update status', 'error');
      }
    });
  }
}
