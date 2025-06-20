// banner-list.component.ts
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
  currentPage = 1;
  limit = 10;
  total = 0;
  totalPages = 0;

  bannerTypeMap: { [key: string]: string } = {
    main_banner: 'Main Banner',
    popup_banner: 'Popup Banner',
    ads_img_banner: 'Advertisement Image',
    ads_video_banner: 'Advertisement Video'
  };

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
    const offset = (this.currentPage - 1) * this.limit;
    this.bannerService.getBanners({ search: this.searchTerm, limit: this.limit, offset }).subscribe({
      next: (response: any) => {
        this.banners = response.data || [];
        this.total = response.total || 0;
        this.totalPages = response.totalPages || Math.ceil(this.total / this.limit);
        this.isLoading = false;
        console.log(response);
      },
      error: (err) => {
        console.error('Error loading banners:', err);
        this.isLoading = false;
        Swal.fire('Error', 'Failed to load banners', 'error');
      }
    });
  }

  onSearchChange() {
    this.currentPage = 1;
    this.loadBanners();
  }

<<<<<<< HEAD
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
=======
  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadBanners();
    }
>>>>>>> d561200030da4bae0d6de985640d42d8e3bee81c
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
