import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { PortalService } from '../services/portal.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '../../../components/confirmation-dialog.component';

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
  minDate = new Date();

  filteredVehicles$!: Observable<any[]>;

  brands: string[] = [];
  filteredBrands$!: Observable<string[]>;

  transmissions: any[] = [];
  filteredTransmissions$!: Observable<any[]>;

  bookingTimes: string[] = [];
  filteredTimes$!: Observable<string[]>;
  bookedTimes: string[] = [];

  constructor(
    private fb: FormBuilder,
    private portalService: PortalService,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
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

    const tomorrowVal = this.bookingForm.get('bookingDate')?.value;
    if (tomorrowVal) {
      this.loadBookedSlots(tomorrowVal);
    }
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

    this.bookingForm.get('bookingDate')?.valueChanges.subscribe(date => {
      this.loadBookedSlots(date);
    });

    this.portalService.getParamsByGroup('VEHICLE_BRAND').subscribe(brandData => {
      this.brands = (brandData || []).map(p => p.kode_param);
      
      this.portalService.getParamsByGroup('VEHICLE_TRANSMISSION').subscribe(transData => {
        this.transmissions = (transData || []).map(p => ({
          id: p.kode_param,
          label: p.nama_param
        }));
        
        this.portalService.getParamsByGroup('BOOKING_TIME').subscribe(timeData => {
          this.bookingTimes = (timeData || []).map(p => p.kode_param);
          this.setupAutocomplete();
        });
      });
    });
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
      map(value => {
        const available = this.bookingTimes.filter(t => !this.bookedTimes.includes(t));
        return value ? this._filterStringArray(value, available) : available;
      })
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

  loadBookedSlots(dateVal: any): void {
    if (!dateVal) {
      this.bookedTimes = [];
      this.bookingForm.get('bookingTime')?.setValue(null, { emitEvent: true });
      return;
    }
    let dateStr = '';
    if (dateVal instanceof Date) {
      const year = dateVal.getFullYear();
      const month = String(dateVal.getMonth() + 1).padStart(2, '0');
      const day = String(dateVal.getDate()).padStart(2, '0');
      dateStr = `${year}-${month}-${day}`;
    } else {
      dateStr = String(dateVal);
    }

    this.portalService.getBookedSlots(dateStr).subscribe({
      next: (slots) => {
        this.bookedTimes = slots || [];
        
        // Check if all slot times are booked
        const isFull = this.bookingTimes.length > 0 && this.bookingTimes.every(t => this.bookedTimes.includes(t));
        if (isFull) {
          this.bookingForm.get('bookingDate')?.setValue(null, { emitEvent: false });
          this.bookingForm.get('bookingTime')?.setValue(null, { emitEvent: false });
          this.bookedTimes = [];
          
          this.dialog.open(ConfirmationDialogComponent, {
            width: '440px',
            data: {
              title: 'Jadwal Penuh',
              message: 'Maaf, jadwal servis untuk tanggal tersebut sudah penuh. Silakan pilih tanggal lainnya.',
              confirmText: 'Pilih Tanggal Lain',
              cancelText: 'Tutup',
              warn: true
            }
          });
          this.cdr.detectChanges();
          return;
        }

        const current = this.bookingForm.get('bookingTime')?.value;
        this.bookingForm.get('bookingTime')?.setValue(current, { emitEvent: true });
        
        if (current && this.bookedTimes.includes(current)) {
          this.bookingForm.get('bookingTime')?.setValue(null);
          this.snackBar.open('Jam yang Anda pilih sebelumnya telah penuh terisi. Silakan pilih jam lain.', 'Tutup', { duration: 4000 });
        }
      },
      error: (err) => {
        console.error('Failed to load booked slots:', err);
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
    if (this.bookingForm.invalid) {
      this.bookingForm.markAllAsTouched();
      return;
    }
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
