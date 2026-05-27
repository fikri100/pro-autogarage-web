import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PortalService } from '../services/portal.service';

export const portalGuard: CanActivateFn = (route, state) => {
  const portalService = inject(PortalService);
  const router = inject(Router);

  if (portalService.isLoggedIn()) {
    return true;
  }

  // Not logged in -> Redirect to customer portal login
  router.navigate(['/portal/login']);
  return false;
};
