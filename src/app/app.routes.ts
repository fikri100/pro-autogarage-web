import { Routes } from '@angular/router';
import { LoginComponent } from './components/login.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: 'portal',
    loadChildren: () => import('./modules/portal/portal.module').then(m => m.PortalModule)
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'customers',
    loadChildren: () => import('./modules/customers/customers.module').then(m => m.CustomersModule),
    canActivate: [authGuard]
  },
  {
    path: 'master',
    loadChildren: () => import('./modules/master/master.module').then(m => m.MasterModule),
    canActivate: [authGuard]
  },
  {
    path: 'user-access',
    loadChildren: () => import('./modules/user-access/user-access.module').then(m => m.UserAccessModule),
    canActivate: [authGuard]
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./modules/dashboard/dashboard.module').then(m => m.DashboardModule),
    canActivate: [authGuard]
  },
  {
    path: 'inventory',
    loadChildren: () => import('./modules/inventory/inventory.module').then(m => m.InventoryModule),
    canActivate: [authGuard]
  },
  {
    path: 'booking',
    loadChildren: () => import('./modules/booking/booking.module').then(m => m.BookingModule),
    canActivate: [authGuard]
  },
  {
    path: 'work-order',
    loadChildren: () => import('./modules/work-order/work-order.module').then(m => m.WorkOrderModule),
    canActivate: [authGuard]
  },
  {
    path: 'cashier',
    loadChildren: () => import('./modules/cashier/cashier.module').then(m => m.CashierModule),
    canActivate: [authGuard]
  },
  {
    path: 'cashflow',
    loadChildren: () => import('./modules/finance/finance.module').then(m => m.FinanceModule),
    canActivate: [authGuard]
  },
  {
    path: 'reports',
    loadChildren: () => import('./modules/reports/reports.module').then(m => m.ReportsModule),
    canActivate: [authGuard]
  }
];
