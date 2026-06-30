import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { PortalService } from '../services/portal.service';

export interface PortalVehicleDialogData {
  mode: 'add' | 'edit';
  vehicle?: any;
}

@Component({
  selector: 'app-portal-vehicle-dialog',
  templateUrl: '../views/portal-vehicle-dialog.html',
  standalone: false
})
export class PortalVehicleDialogComponent implements OnInit {
  vehicleForm!: FormGroup;
  isSaving = false;

  brands: string[] = [];
  filteredBrands$!: Observable<string[]>;

  transmissions: any[] = [];
  filteredTransmissions$!: Observable<any[]>;

  constructor(
    private fb: FormBuilder,
    private portalService: PortalService,
    public dialogRef: MatDialogRef<PortalVehicleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PortalVehicleDialogData
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.portalService.getParamsByGroup('VEHICLE_BRAND').subscribe(brandData => {
      this.brands = (brandData || []).map(p => p.kode_param);
      
      this.portalService.getParamsByGroup('VEHICLE_TRANSMISSION').subscribe(transData => {
        this.transmissions = (transData || []).map(p => ({
          id: p.kode_param,
          label: p.nama_param
        }));
        this.setupAutocomplete();
      });
    });
  }

  setupAutocomplete(): void {
    this.filteredBrands$ = this.vehicleForm.get('brand')!.valueChanges.pipe(
      startWith(this.vehicleForm.get('brand')!.value || ''),
      map(value => value ? this._filterStringArray(value, this.brands) : this.brands.slice())
    );

    this.filteredTransmissions$ = this.vehicleForm.get('transmission')!.valueChanges.pipe(
      startWith(this.vehicleForm.get('transmission')!.value || ''),
      map(value => {
        const name = typeof value === 'string' ? value : (this.getTransmissionLabel(value) || '');
        return name ? this.transmissions.filter(t => t.label.toLowerCase().includes(name.toLowerCase())) : this.transmissions.slice();
      })
    );
  }

  private _filterStringArray(value: string, arr: string[]): string[] {
    const filterValue = value.toLowerCase();
    return arr.filter(option => option.toLowerCase().includes(filterValue));
  }

  getTransmissionLabel(id: string): string {
    if (!id) return '';
    const t = this.transmissions.find(x => x.id === id);
    return t ? t.label : id;
  }

  displayTransmission = (id: string): string => {
    return this.getTransmissionLabel(id);
  }

  private initForm(): void {
    const v = this.data.vehicle;
    this.vehicleForm = this.fb.group({
      licensePlate: [v?.licensePlate || '', [Validators.required, Validators.pattern(/^[A-Z]{1,3}\s[0-9]{1,4}\s[A-Z]{1,3}$/)]],
      brand: [v?.brand || null, [Validators.required]],
      model: [v?.model || '', [Validators.required]],
      yearMade: [v?.yearMade || new Date().getFullYear(), [Validators.required, Validators.min(1980), Validators.max(new Date().getFullYear() + 1)]],
      transmission: [v?.transmission || null, [Validators.required]]
    });
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
    this.vehicleForm.get('licensePlate')?.setValue(formatted, { emitEvent: false });
    event.target.value = formatted;
    event.target.setSelectionRange(formatted.length, formatted.length);
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onSave(): void {
    this.vehicleForm.markAllAsTouched();
    if (this.vehicleForm.invalid) return;
    this.isSaving = true;
    
    const formVal = { ...this.vehicleForm.value };
    formVal.licensePlate = this.formatPlate(formVal.licensePlate);
    
    this.dialogRef.close(formVal);
  }
}
