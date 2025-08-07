import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { NgScrollbar } from 'ngx-scrollbar';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment'; 


import { IconDirective } from '@coreui/icons-angular';
import {
  ContainerComponent,
  ShadowOnScrollDirective,
  SidebarBrandComponent,
  SidebarComponent,
  SidebarFooterComponent,
  SidebarHeaderComponent,
  SidebarNavComponent,
  SidebarToggleDirective,
  SidebarTogglerDirective
} from '@coreui/angular';

import { SellerFooterComponent,SellerHeaderComponent } from './';
import { navItems } from './_nav';

function isOverflown(element: HTMLElement) {
  return (
    element.scrollHeight > element.clientHeight ||
    element.scrollWidth > element.clientWidth
  );
}

@Component({
  selector: 'app-seller-dashboard-layout',
   imports: [
      SidebarComponent,
      SidebarHeaderComponent,
      SidebarBrandComponent,
      SidebarNavComponent,
      SidebarFooterComponent,
      SidebarToggleDirective,
      SidebarTogglerDirective,
      ContainerComponent,
      SellerFooterComponent,
      SellerHeaderComponent,
      IconDirective,
      NgScrollbar,
      RouterOutlet,
      RouterLink,
      ShadowOnScrollDirective
    ],
  templateUrl: './seller-dashboard-layout.component.html',
  styleUrl: './seller-dashboard-layout.component.scss'
})
export class SellerDashboardLayoutComponent  {
  public navItems = [...navItems];
  public logoUrl: string = '';

  constructor(private http: HttpClient) {
    this.loadBusinessLogo();
  }

  loadBusinessLogo(): void {
    this.http.get<any>(`${environment.apiUrl}/admin/setting/business-setup`).subscribe({
      next: (res) => {
        const logoPath = res?.data?.websiteLogo;
        if (logoPath) {
          const baseUrl = environment.mediaUrl;
          this.logoUrl = logoPath.startsWith('http') ? logoPath : `${baseUrl}${logoPath.replace(/^\/+/, '')}`;
        } else {
          console.warn('No logo path found in response.');
        }
      },
      error: (err) => {
        console.error('Failed to load business logo:', err);
      }
    });
  }

}