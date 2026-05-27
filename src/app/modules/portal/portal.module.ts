import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Components
import { PortalLoginComponent } from './components/portal-login.component';
import { PortalRegisterComponent } from './components/portal-register.component';
import { PortalLayoutComponent } from './components/portal-layout.component';
import { PortalDashboardComponent } from './components/portal-dashboard.component';
import { PortalBookingComponent } from './components/portal-booking.component';
import { PortalHistoryComponent } from './components/portal-history.component';
import { PortalVehicleComponent } from './components/portal-vehicle.component';
import { PortalVehicleDialogComponent } from './components/portal-vehicle-dialog.component';
import { PortalProfileComponent } from './components/portal-profile.component';
import { routes } from './portal.routes';

// Angular Material
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatStepperModule } from '@angular/material/stepper';
import { SharedModule } from '../shared.module';

@NgModule({
  declarations: [
    PortalLoginComponent,
    PortalRegisterComponent,
    PortalLayoutComponent,
    PortalDashboardComponent,
    PortalBookingComponent,
    PortalHistoryComponent,
    PortalVehicleComponent,
    PortalVehicleDialogComponent,
    PortalProfileComponent
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
    MatSelectModule,
    MatSidenavModule,
    MatToolbarModule,
    MatMenuModule,
    MatDialogModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatStepperModule,
    SharedModule
  ]
})
export class PortalModule { }
