import { Injectable } from '@angular/core';
import {
  CanActivate,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { Observable } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  exp: number;
  role: string;
}

@Injectable({
  providedIn: 'root',
})
export class SellerAuthGuard implements CanActivate {
  constructor(private router: Router) { }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    const token = localStorage.getItem('seller_token');
    const user = localStorage.getItem('seller_profile');

    if (!token || !user) {
      this.router.navigate(['/seller/login']);
      return false;
    }

    try {
      const decoded: DecodedToken = jwtDecode(token);
      const now = Math.floor(Date.now() / 1000);

      if (decoded.exp < now || decoded.role !== 'seller') {
        localStorage.clear();
        this.router.navigate(['/seller/login']);
        return false;
      }
      return true;
    } catch (error) {
      localStorage.clear();
      this.router.navigate(['/seller/login']);
      return false;
    }
  }
}
