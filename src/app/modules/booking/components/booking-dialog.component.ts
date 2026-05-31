import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { BookingService } from '../booking.service';

export interface BookingDialogData {
  mode: 'add' | 'confirm' | 'cancel';
  message?: string;
}

@Component({
  selector: 'app-booking-dialog',
  templateUrl: '../views/booking-dialog.html',
  standalone: false
})
export class BookingDialogComponent implements OnInit {
  bookingForm!: FormGroup;
  isSaving = false;

  customers: any[] = [];
  vehicles: any[] = [];
  filteredVehicles: any[] = [];

  filteredCustomers$!: Observable<any[]>;
  filteredVehicles$!: Observable<any[]>;

  bookingTimes = [
    '08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'
  ];
  filteredBookingTimes$!: Observable<string[]>;

  constructor(
    private fb: FormBuilder,
    private bookingService: BookingService,
    public dialogRef: MatDialogRef<BookingDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: BookingDialogData
  ) {}

  ngOnInit(): void {
    if (this.data.mode === 'add') {
      this.bookingForm = this.fb.group({
        customerId: [null, [Validators.required]],
        vehicleId: [{ value: null, disabled: true }, [Validators.required]],
        bookingDate: [null, [Validators.required]],
        bookingTime: ['09:00', [Validators.required]],
        complaints: [null]
      });

      this.loadCustomersAndVehicles();

      // Filter vehicles based on selected customer
      this.bookingForm.get('customerId')?.valueChanges.subscribe(custId => {
        if (typeof custId === 'number') {
          this.filteredVehicles = this.vehicles.filter(v => v.customerId === custId);
          this.bookingForm.get('vehicleId')?.enable({ emitEvent: false });
        } else {
          this.filteredVehicles = [];
          this.bookingForm.get('vehicleId')?.disable({ emitEvent: false });
        }
        // only reset if customer changes to a different one or invalid
        const currentV = this.bookingForm.get('vehicleId')?.value;
        if (currentV && !this.filteredVehicles.find(v => v.id === currentV)) {
          this.bookingForm.get('vehicleId')?.setValue(null, { emitEvent: false });
        }
        this.bookingForm.get('vehicleId')?.updateValueAndValidity({ emitEvent: false });
      });

      this.setupAutocomplete();
    }
  }

  setupAutocomplete(): void {
    this.filteredCustomers$ = this.bookingForm.get('customerId')!.valueChanges.pipe(
      startWith(''),
      map(value => {
        const name = typeof value === 'string' ? value : (this.getCustomerName(value) || '');
        return name ? this.customers.filter(c => c.name.toLowerCase().includes(name.toLowerCase())) : this.customers.slice();
      })
    );

    this.filteredVehicles$ = this.bookingForm.get('vehicleId')!.valueChanges.pipe(
      startWith(''),
      map(value => {
        const name = typeof value === 'string' ? value : (this.getVehicleName(value) || '');
        return name ? this.filteredVehicles.filter(v => v.licensePlate.toLowerCase().includes(name.toLowerCase()) || v.brand.toLowerCase().includes(name.toLowerCase())) : this.filteredVehicles.slice();
      })
    );

    this.filteredBookingTimes$ = this.bookingForm.get('bookingTime')!.valueChanges.pipe(
      startWith(this.bookingForm.get('bookingTime')!.value || ''),
      map(value => {
        return value ? this.bookingTimes.filter(t => t.includes(value)) : this.bookingTimes.slice();
      })
    );
  }

  getCustomerName(id: number): string {
    const c = this.customers.find(x => x.id === id);
    return c ? `${c.name} - ${c.phone}` : '';
  }

  displayCustomer = (id: number): string => {
    return this.getCustomerName(id);
  }

  getVehicleName(id: number): string {
    const v = this.vehicles.find(x => x.id === id);
    return v ? `${v.licensePlate} (${v.brand} ${v.model})` : '';
  }

  displayVehicle = (id: number): string => {
    return this.getVehicleName(id);
  }

  displayTime = (val: string): string => val;

  loadCustomersAndVehicles(): void {
    this.bookingService.getCustomers().subscribe(data => {
      this.customers = data || [];
      // Trigger update on load
      this.bookingForm.get('customerId')?.updateValueAndValidity();
    });
    this.bookingService.getVehicles().subscribe(data => {
      this.vehicles = data || [];
      // Trigger update on load
      this.bookingForm.get('customerId')?.updateValueAndValidity();
    });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onSave(): void {
    if (this.bookingForm.invalid) {
      this.bookingForm.markAllAsTouched();
      return;
    }
    const val = { ...this.bookingForm.value };
    if (val.bookingDate instanceof Date) {
      const d = val.bookingDate;
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      val.bookingDate = `${year}-${month}-${day}`;
    }
    this.dialogRef.close(val);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
