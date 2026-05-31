import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
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
  @ViewChild('custTrigger') custTrigger!: MatAutocompleteTrigger;
  @ViewChild('vehTrigger') vehTrigger!: MatAutocompleteTrigger;

  bookingForm!: FormGroup;
  isSaving = false;

  customers: any[] = [];
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
        bookingTime: [null, [Validators.required]],
        complaints: [null]
      });

      this.loadCustomersAndVehicles();

      // Filter vehicles based on selected customer
      this.bookingForm.get('customerId')?.valueChanges.subscribe(custId => {
        if (typeof custId === 'number') {
          this.bookingService.getVehicles(custId).subscribe(data => {
            this.filteredVehicles = data || [];
            this.bookingForm.get('vehicleId')?.enable({ emitEvent: false });
            this.bookingForm.get('vehicleId')?.setValue(null, { emitEvent: true });
            
            // Open registered vehicles dropdown automatically!
            setTimeout(() => {
              if (this.vehTrigger) {
                this.vehTrigger.openPanel();
              }
            }, 150);
          });
        } else {
          this.filteredVehicles = [];
          this.bookingForm.get('vehicleId')?.disable({ emitEvent: false });
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

  getCustomerName(id: any): string {
    if (id === null || id === undefined) return '';
    const c = this.customers.find(x => x.id === id);
    return c ? `${c.name} - ${c.phone}` : '';
  }

  displayCustomer = (id: number): string => {
    return this.getCustomerName(id);
  }

  getVehicleName(id: any): string {
    if (id === null || id === undefined) return '';
    const v = this.filteredVehicles.find(x => x.id === id);
    return v ? `${v.licensePlate} (${v.brand} ${v.model})` : '';
  }

  displayVehicle = (id: number): string => {
    return this.getVehicleName(id);
  }

  displayTime = (val: string): string => val;

  loadCustomersAndVehicles(): void {
    this.bookingService.getCustomers(1000).subscribe((res: any) => {
      this.customers = res.data || [];
      // Force valueChanges stream to emit so autocomplete is populated
      const currentVal = this.bookingForm.get('customerId')?.value;
      this.bookingForm.get('customerId')?.setValue(currentVal, { emitEvent: true });
      
      // Auto open customer dropdown immediately when pop-up opens and data loaded
      setTimeout(() => {
        if (this.custTrigger) {
          this.custTrigger.openPanel();
        }
      }, 300);
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
