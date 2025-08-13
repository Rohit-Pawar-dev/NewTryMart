import { HttpInterceptorFn } from '@angular/common/http';
import { HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

export const AuthInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {
  const token = localStorage.getItem('token');
  const sellerToken = localStorage.getItem('seller_token');
  // console.log(token + "admin token");
  // console.log(sellerToken + "sellerToken");

  let authReq = req;

  // Check if the request is for the seller API
  if (req.url.includes('/api/sellers') && sellerToken) {
    if (sellerToken) {
      authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${sellerToken}`)
      });
      console.log('added seller token');
    }
  } else {
    if (token) {
      authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
      console.log('Added admin token', token);
    }
  }

  return next(authReq);
};
