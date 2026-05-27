import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PortalService } from '../services/portal.service';

@Component({
  selector: 'app-portal-booking',
  templateUrl: '../views/portal-booking.html',
  standalone: false
})
export class PortalBookingComponent implements OnInit {
  bookingForm!: FormGroup;
  loading = false;
  loadingVehicles = false;
  customerName = '';
  vehicles: any[] = [];
  selectedVehicle: any = null;

  constructor(
    private fb: FormBuilder,
    private portalService: PortalService,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const customer = this.portalService.currentCustomer;
    if (!customer) {
      this.router.navigate(['/portal/login']);
      return;
    }
    this.customerName = customer.name;
    this.initForm();
    this.loadVehicles();
  }

  private initForm(): void {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    this.bookingForm = this.fb.group({
      vehicleId: ['new', [Validators.required]],
      licensePlate: ['', [Validators.required, Validators.pattern(/^[a-zA-Z]{1,3}\s[0-9]{1,4}\s[a-zA-Z]{1,3}$/)]],
      brand: ['', [Validators.required]],
      model: ['', [Validators.required]],
      yearMade: [new Date().getFullYear(), [Validators.required, Validators.min(1980), Validators.max(new Date().getFullYear() + 1)]],
      transmission: ['AUTOMATIC', [Validators.required]],
      bookingDate: [tomorrow, [Validators.required]],
      bookingTime: ['09:00', [Validators.required]],
      complaints: ['', []]
    });
  }

  loadVehicles(): void {
    this.loadingVehicles = true;
    this.cdr.detectChanges();
    this.portalService.getVehicles().subscribe({
      next: (data) => {
        this.vehicles = data || [];
        this.loadingVehicles = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load customer vehicles for booking:', err);
        this.loadingVehicles = false;
        this.cdr.detectChanges();
      }
    });
  }

  onVehicleSelect(event: any): void {
    const vehicleId = event.value;
    if (vehicleId === 'new') {
      this.selectedVehicle = null;
      this.enableVehicleFields();
      this.bookingForm.patchValue({
        licensePlate: '',
        brand: '',
        model: '',
        yearMade: new Date().getFullYear(),
        transmission: 'AUTOMATIC'
      });
    } else {
      const v = this.vehicles.find(x => x.id === vehicleId);
      if (v) {
        this.selectedVehicle = v;
        
        let trans = 'AUTOMATIC';
        if (v.transmission) {
          const tUpper = v.transmission.toUpperCase();
          if (tUpper.includes('MANUAL') || tUpper.includes('MT')) {
            trans = 'MANUAL';
          }
        }

        this.bookingForm.patchValue({
          licensePlate: v.licensePlate,
          brand: v.brand,
          model: v.model,
          yearMade: v.yearMade,
          transmission: trans
        });
        this.disableVehicleFields();
      }
    }
  }

  disableVehicleFields(): void {
    this.bookingForm.get('licensePlate')?.disable();
    this.bookingForm.get('brand')?.disable();
    this.bookingForm.get('model')?.disable();
    this.bookingForm.get('yearMade')?.disable();
    this.bookingForm.get('transmission')?.disable();
  }

  enableVehicleFields(): void {
    this.bookingForm.get('licensePlate')?.enable();
    this.bookingForm.get('brand')?.enable();
    this.bookingForm.get('model')?.enable();
    this.bookingForm.get('yearMade')?.enable();
    this.bookingForm.get('transmission')?.enable();
  }

  onPlateInput(event: any): void {
    let val = event.target.value.toUpperCase();
    this.bookingForm.get('licensePlate')?.setValue(val, { emitEvent: false });
  }

  onSubmit(): void {
    if (this.bookingForm.invalid) return;
    this.loading = true;

    // Use getRawValue to retrieve disabled inputs (e.g. brand, license plate)
    const payload = { ...this.bookingForm.getRawValue() };
    delete payload.vehicleId; // clean up payload for backend

    // Format bookingDate
    if (payload.bookingDate instanceof Date) {
      const d = payload.bookingDate;
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      payload.bookingDate = `${year}-${month}-${day}`;
    }

    this.portalService.createBooking(payload).subscribe({
      next: () => {
        this.loading = false;
        this.snackBar.open('Reservasi servis berhasil diajukan! Menunggu persetujuan admin.', 'OK', { duration: 4000, panelClass: 'snack-success' });
        this.router.navigate(['/portal/history']);
      },
      error: (err) => {
        this.loading = false;
        const msg = err.error && err.error.error ? err.error.error : 'Gagal mengajukan booking!';
        this.snackBar.open(msg, 'Tutup', { duration: 3000, panelClass: 'snack-error' });
      }
    });
  }
}
