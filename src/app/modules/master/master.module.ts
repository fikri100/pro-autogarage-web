import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Angular Material
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatPaginatorModule } from '@angular/material/paginator';

import { RoleCrudComponent } from './components/role-crud.component';
import { CategoryCrudComponent } from './components/category-crud.component';
import { EmployeeCrudComponent } from './components/employee-crud.component';
import { RoleDetailComponent } from './components/role-detail.component';
import { CategoryDetailComponent } from './components/category-detail.component';
import { EmployeeDetailComponent } from './components/employee-detail.component';
import { routes } from './master.routes';
import { SharedModule } from '../shared.module';

@NgModule({
  declarations: [
    RoleCrudComponent,
    CategoryCrudComponent,
    EmployeeCrudComponent,
    RoleDetailComponent,
    CategoryDetailComponent,
    EmployeeDetailComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatAutocompleteModule,
    MatPaginatorModule,
    SharedModule
  ]
})
export class MasterModule { }
