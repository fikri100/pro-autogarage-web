import { Routes } from '@angular/router';
import { RoleCrudComponent } from './components/role-crud.component';
import { CategoryCrudComponent } from './components/category-crud.component';
import { EmployeeCrudComponent } from './components/employee-crud.component';

export const routes: Routes = [
  { path: 'role', component: RoleCrudComponent },
  { path: 'category', component: CategoryCrudComponent },
  { path: 'employee', component: EmployeeCrudComponent }
];
