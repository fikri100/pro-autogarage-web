import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
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
        vehicleId: [null, [Validators.required]],
        bookingDate: [null, [Validators.required]],
        bookingTime: ['09:00', [Validators.required]],
        complaints: [null]
      });

      this.loadCustomersAndVehicles();

      // Filter vehicles based on selected customer
      this.bookingForm.get('customerId')?.valueChanges.subscribe(custId => {
        this.bookingForm.get('vehicleId')?.setValue(null);
        if (custId) {
          this.filteredVehicles = this.vehicles.filter(v => v.customerId === custId);
        } else {
          this.filteredVehicles = [];
        }
      });
    }
  }

  loadCustomersAndVehicles(): void {
    this.bookingService.getCustomers().subscribe(data => {
      this.customers = data || [];
    });
    this.bookingService.getVehicles().subscribe(data => {
      this.vehicles = data || [];
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
