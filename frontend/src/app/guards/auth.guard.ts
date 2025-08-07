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
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('profile');

    if (!token || !user) {
      this.router.navigate(['/admin/login']);
      return false;
    }
    try {
      const decoded: DecodedToken = jwtDecode(token);
      const now = Math.floor(Date.now() / 1000);

      if (decoded.exp < now || decoded.role !== 'admin') {
        localStorage.clear();
        this.router.navigate(['/admin/login']);
        return false;
      }
      return true;
    } catch (error) {
      localStorage.clear();
      this.router.navigate(['/admin/login']);
      return false;
    }
  }
}

