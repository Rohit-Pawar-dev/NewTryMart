import { HttpInterceptorFn } from '@angular/common/http';
import { HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

export const AuthInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {
  const token = localStorage.getItem('token');
  const sellerToken = localStorage.getItem('seller_token');

  let authReq = req;

  if (req.url.includes('/api/sellers') && sellerToken) {
    if (sellerToken) {
      authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${sellerToken}`)
      });
    }
  } else {
    if (token) {
      authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
    }
  }

  return next(authReq);
};
