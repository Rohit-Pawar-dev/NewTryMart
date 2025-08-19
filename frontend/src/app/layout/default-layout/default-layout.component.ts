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

import { DefaultFooterComponent, DefaultHeaderComponent } from './';
import { navItems } from './_nav';

function isOverflown(element: HTMLElement) {
  return (
    element.scrollHeight > element.clientHeight ||
    element.scrollWidth > element.clientWidth
  );
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './default-layout.component.html',
  styleUrls: ['./default-layout.component.scss'],
  imports: [
    SidebarComponent,
    SidebarHeaderComponent,
    SidebarBrandComponent,
    SidebarNavComponent,
    ContainerComponent,
    DefaultFooterComponent,
    DefaultHeaderComponent,
    IconDirective,
    NgScrollbar,
    RouterOutlet,
    RouterLink,
    ShadowOnScrollDirective
  ]
})

export class DefaultLayoutComponent {
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

