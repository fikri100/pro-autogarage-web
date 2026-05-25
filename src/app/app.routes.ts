import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'customers', pathMatch: 'full' },
  {
    path: 'customers',
    loadChildren: () => import('./modules/customers/customers.module').then(m => m.CustomersModule)
  },
  {
    path: 'user-access',
    loadChildren: () => import('./modules/user-access/user-access.module').then(m => m.UserAccessModule)
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./modules/dashboard/dashboard.module').then(m => m.DashboardModule)
  },
  {
    path: 'inventory',
    loadChildren: () => import('./modules/inventory/inventory.module').then(m => m.InventoryModule)
  },
  {
    path: 'booking',
    loadChildren: () => import('./modules/booking/booking.module').then(m => m.BookingModule)
  },
  {
    path: 'work-order',
    loadChildren: () => import('./modules/work-order/work-order.module').then(m => m.WorkOrderModule)
  },
  {
    path: 'cashier',
    loadChildren: () => import('./modules/cashier/cashier.module').then(m => m.CashierModule)
  },
  {
    path: 'cashflow',
    loadChildren: () => import('./modules/finance/finance.module').then(m => m.FinanceModule)
  },
  {
    path: 'reports',
    loadChildren: () => import('./modules/placeholders/placeholders.module').then(m => m.PlaceholdersModule)
  }
];
