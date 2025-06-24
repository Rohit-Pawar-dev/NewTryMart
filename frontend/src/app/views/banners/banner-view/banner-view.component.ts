import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BannerService, Banner } from '../../../../app/services/banner.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-banner-view',
  templateUrl: './banner-view.component.html',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
})
export class BannerViewComponent implements OnInit {
  banner: Banner | null = null;
  isLoading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private bannerService: BannerService,
    public router: Router // made public for template use
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    this.bannerService.getBanner(id).subscribe({
      next: (data) => {
        this.banner = data;
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Failed to load banner.';
        this.isLoading = false;
      },
    });
  }

  get bannerTypeDisplay(): string {
    return this.banner?.banner_type.replace(/_/g, ' ') || '';
  }
}
