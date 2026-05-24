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
    loadChildren: () => import('./modules/placeholders/placeholders.module').then(m => m.PlaceholdersModule)
  },
  {
    path: 'inventory',
    loadChildren: () => import('./modules/placeholders/placeholders.module').then(m => m.PlaceholdersModule)
  },
  {
    path: 'booking',
    loadChildren: () => import('./modules/placeholders/placeholders.module').then(m => m.PlaceholdersModule)
  },
  {
    path: 'work-order',
    loadChildren: () => import('./modules/placeholders/placeholders.module').then(m => m.PlaceholdersModule)
  },
  {
    path: 'cashier',
    loadChildren: () => import('./modules/placeholders/placeholders.module').then(m => m.PlaceholdersModule)
  },
  {
    path: 'cashflow',
    loadChildren: () => import('./modules/placeholders/placeholders.module').then(m => m.PlaceholdersModule)
  },
  {
    path: 'reports',
    loadChildren: () => import('./modules/placeholders/placeholders.module').then(m => m.PlaceholdersModule)
  }
];
