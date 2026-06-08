import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
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

  filteredVehicles$!: Observable<any[]>;

  brands = ['Honda', 'Toyota', 'Daihatsu', 'Suzuki', 'Mitsubishi', 'Nissan', 'Mazda', 'Hyundai', 'Wuling', 'Lainnya'];
  filteredBrands$!: Observable<string[]>;

  transmissions = [{id: 'AUTOMATIC', label: 'Automatic (AT)'}, {id: 'MANUAL', label: 'Manual (MT)'}];
  filteredTransmissions$!: Observable<any[]>;

  bookingTimes = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'];
  filteredTimes$!: Observable<string[]>;

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
      vehicleId: [null, [Validators.required]],
      licensePlate: ['', [Validators.required, Validators.pattern(/^[A-Z]{1,3}\s[0-9]{1,4}\s[A-Z]{1,3}$/)]],
      brand: [null, [Validators.required]],
      model: ['', [Validators.required]],
      yearMade: [new Date().getFullYear(), [Validators.required, Validators.min(1980), Validators.max(new Date().getFullYear() + 1)]],
      transmission: [null, [Validators.required]],
      bookingDate: [tomorrow, [Validators.required]],
      bookingTime: [null, [Validators.required]],
      complaints: ['', []]
    });

    this.setupAutocomplete();
  }

  setupAutocomplete(): void {
    this.filteredVehicles$ = this.bookingForm.get('vehicleId')!.valueChanges.pipe(
      startWith(''),
      map(value => {
        const name = typeof value === 'string' ? value : (this.getVehicleName(value) || '');
        return name ? this._filterVehicles(name) : this.vehicles.slice();
      })
    );

    this.filteredBrands$ = this.bookingForm.get('brand')!.valueChanges.pipe(
      startWith(''),
      map(value => value ? this._filterStringArray(value, this.brands) : this.brands.slice())
    );

    this.filteredTransmissions$ = this.bookingForm.get('transmission')!.valueChanges.pipe(
      startWith(''),
      map(value => {
        const name = typeof value === 'string' ? value : (this.getTransmissionLabel(value) || '');
        return name ? this.transmissions.filter(t => t.label.toLowerCase().includes(name.toLowerCase())) : this.transmissions.slice();
      })
    );

    this.filteredTimes$ = this.bookingForm.get('bookingTime')!.valueChanges.pipe(
      startWith(''),
      map(value => value ? this._filterStringArray(value, this.bookingTimes) : this.bookingTimes.slice())
    );
  }

  private _filterVehicles(name: string): any[] {
    const filterValue = name.toLowerCase();
    return this.vehicles.filter(v => 
      (v.licensePlate && v.licensePlate.toLowerCase().includes(filterValue)) || 
      (v.brand && v.brand.toLowerCase().includes(filterValue)) || 
      (v.model && v.model.toLowerCase().includes(filterValue))
    );
  }

  private _filterStringArray(value: string, arr: string[]): string[] {
    const filterValue = value.toLowerCase();
    return arr.filter(option => option.toLowerCase().includes(filterValue));
  }

  getVehicleName(id: any): string {
    if (!id) return '';
    if (id === 'new') return '-- Kendaraan Baru (Input Manual) --';
    const v = this.vehicles.find(x => x.id === id);
    return v ? `[${v.licensePlate}] ${v.brand} ${v.model}` : '';
  }

  displayVehicle = (id: any): string => {
    return this.getVehicleName(id);
  }

  getTransmissionLabel(id: string): string {
    if (!id) return '';
    const t = this.transmissions.find(x => x.id === id);
    return t ? t.label : id;
  }

  displayTransmission = (id: string): string => {
    return this.getTransmissionLabel(id);
  }

  loadVehicles(): void {
    this.loadingVehicles = true;
    this.cdr.detectChanges();
    this.portalService.getVehicles().subscribe({
      next: (data) => {
        this.vehicles = data || [];
        this.loadingVehicles = false;
        this.bookingForm.get('vehicleId')?.updateValueAndValidity();
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
        brand: null,
        model: '',
        yearMade: new Date().getFullYear(),
        transmission: null
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

  /**
   * Formats raw input into Indonesian license plate format: AA 1234 ABC
   * Strips invalid chars, auto-inserts spaces between letter/digit segments.
   */
  private formatPlate(raw: string): string {
    const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const match = clean.match(/^([A-Z]{1,3})([0-9]{0,4})([A-Z]{0,3})/);
    if (!match) return clean;
    const [, prefix, numbers, suffix] = match;
    let result = prefix;
    if (numbers) result += ' ' + numbers;
    if (suffix)  result += ' ' + suffix;
    return result;
  }

  onPlateInput(event: any): void {
    const formatted = this.formatPlate(event.target.value);
    this.bookingForm.get('licensePlate')?.setValue(formatted, { emitEvent: false });
    event.target.value = formatted;
    event.target.setSelectionRange(formatted.length, formatted.length);
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
