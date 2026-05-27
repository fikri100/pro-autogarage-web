import { Routes } from '@angular/router';
import { PortalLoginComponent } from './components/portal-login.component';
import { PortalRegisterComponent } from './components/portal-register.component';
import { PortalLayoutComponent } from './components/portal-layout.component';
import { PortalDashboardComponent } from './components/portal-dashboard.component';
import { PortalBookingComponent } from './components/portal-booking.component';
import { PortalHistoryComponent } from './components/portal-history.component';
import { PortalVehicleComponent } from './components/portal-vehicle.component';
import { PortalProfileComponent } from './components/portal-profile.component';
import { portalGuard } from './guards/portal.guard';

export const routes: Routes = [
  { path: 'login', component: PortalLoginComponent },
  { path: 'register', component: PortalRegisterComponent },
  {
    path: '',
    component: PortalLayoutComponent,
    canActivate: [portalGuard],
    children: [
      { path: 'dashboard', component: PortalDashboardComponent },
      { path: 'booking', component: PortalBookingComponent },
      { path: 'history', component: PortalHistoryComponent },
      { path: 'vehicles', component: PortalVehicleComponent },
      { path: 'profile', component: PortalProfileComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];
