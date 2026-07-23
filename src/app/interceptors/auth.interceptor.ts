import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { PortalService } from '../modules/portal/services/portal.service';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const portalService = inject(PortalService);

  let token: string | null = null;
  const isPortalApi = req.url.includes('/api/portal/');

  // Determine if it is a portal route or admin route based on URL path
  if (isPortalApi) {
    const customer = portalService.currentCustomer;
    if (customer && customer.token) {
      token = customer.token;
    }
  } else if (req.url.includes('/api/')) {
    const user = authService.currentUser;
    if (user && user.token) {
      token = user.token;
    }
  }

  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error) => {
      // Public endpoints that don't trigger logout redirect
      const isPublicRoute = req.url.includes('/api/login') ||
                            req.url.includes('/api/portal/login') ||
                            req.url.includes('/api/portal/register') ||
                            req.url.includes('/api/portal/verify-otp') ||
                            req.url.includes('/api/portal/send-otp') ||
                            req.url.includes('/api/health');

      const errBodyStr = typeof error?.error === 'string' 
        ? error.error 
        : JSON.stringify(error?.error || '');

      const isUnauthorized = !isPublicRoute && (
        error?.status === 401 ||
        error?.status === 403 ||
        errBodyStr.toLowerCase().includes('unauthorized') ||
        errBodyStr.toLowerCase().includes('missing token') ||
        errBodyStr.toLowerCase().includes('invalid token')
      );

      if (isUnauthorized) {
        if (isPortalApi) {
          portalService.logout();
        } else {
          authService.logout();
        }
      }
      return throwError(() => error);
    })
  );
};
