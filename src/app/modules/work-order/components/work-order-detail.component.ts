import { Component, OnInit, ChangeDetectorRef, Inject, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormControl } from '@angular/forms';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { WorkOrderService } from '../work-order.service';
import { WorkOrder } from '../models/object';
import { EstimateDialogComponent } from './estimate-dialog.component';

export interface WorkOrderDetailData {
  workOrder: WorkOrder;
}

@Component({
  selector: 'app-work-order-detail',
  templateUrl: '../views/work-order-detail.html',
  standalone: false
})
export class WorkOrderDetailComponent implements OnInit {
  @ViewChild('mechTrigger', { read: MatAutocompleteTrigger }) mechTrigger!: MatAutocompleteTrigger;

  workOrder: WorkOrder;
  loading = false;
  isSaving = false;
  isChanged = false; // Flag to tell list to reload when closed

  mechanics: any[] = [];
  mechanicsLoaded = false;
  estimationDetails: any[] = [];
  estimationTotal = 0;

  // Mechanic assignment fields
  selectedMechanicId: number | null = null;
  mechanicControl = new FormControl();
  filteredMechanics$!: Observable<any[]>;
  woNotes = '';

  // Duration fields
  estimatedHours: number = 0;
  estimatedMins: number = 0;
  computedCompletion: string = '';

  detailsColumns: string[] = ['code', 'name', 'type', 'qty', 'price', 'subtotal', 'actions'];

  constructor(
    private woService: WorkOrderService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    public dialogRef: MatDialogRef<WorkOrderDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: WorkOrderDetailData
  ) {
    this.workOrder = data.workOrder;
  }

  ngOnInit(): void {
    if (this.workOrder) {
      this.selectedMechanicId = this.workOrder.mechanicId || null;
      this.mechanicControl.setValue(this.selectedMechanicId, { emitEvent: false });
      this.woNotes = this.workOrder.notes || '';

      if (this.workOrder.estimatedMinutes) {
        this.estimatedHours = Math.floor(this.workOrder.estimatedMinutes / 60);
        this.estimatedMins = this.workOrder.estimatedMinutes % 60;
      } else {
        this.estimatedHours = 0;
        this.estimatedMins = 0;
      }

      this.computeEstimatedCompletion(this.workOrder);
      this.loadEstimationDetails(this.workOrder.id!);
      this.setupMechanicAutocomplete();
    }
  }

  setupMechanicAutocomplete(): void {
    this.filteredMechanics$ = this.mechanicControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        const name = typeof value === 'string' ? value : (this.getMechanicName(value) || '');
        return name ? this._filterMechanics(name) : this.mechanics.slice();
      })
    );

    this.mechanicControl.valueChanges.subscribe(val => {
      if (typeof val === 'number') {
        this.selectedMechanicId = val;
      }
    });
  }

  private _filterMechanics(name: string): any[] {
    const filterValue = name.toLowerCase();
    return this.mechanics.filter(m => 
      m.name.toLowerCase().includes(filterValue) || 
      m.position.toLowerCase().includes(filterValue)
    );
  }

  getMechanicName(id: number | null): string {
    if (!id) return '';
    const m = this.mechanics.find(x => x.id === id);
    if (m) return `${m.name} (${m.position})`;
    if (this.workOrder && this.workOrder.mechanicId === id && this.workOrder.mechanicName) {
      return this.workOrder.mechanicName;
    }
    return '';
  }

  displayMechanic = (id: number): string => {
    return this.getMechanicName(id);
  }

  loadMechanics(): void {
    this.woService.getMechanics().subscribe((res: any) => {
      this.mechanicsLoaded = true;
      const emps = res.data || res || [];
      this.mechanics = emps.filter((m: any) => 
        m.position?.toLowerCase().includes('mechanic') || 
        m.position?.toLowerCase().includes('mekanik')
      );
      this.mechanicControl.updateValueAndValidity();
      
      setTimeout(() => {
        if (this.mechTrigger) {
          this.mechTrigger.openPanel();
        }
      }, 150);
    });
  }

  onMechanicFocus(): void {
    if (this.workOrder?.workStatus !== 'IN_PROGRESS') return;
    if (!this.mechanicsLoaded) {
      this.loadMechanics();
    }
  }

  loadEstimationDetails(woId: number): void {
    this.woService.getEstimation(woId).subscribe({
      next: (data: any) => {
        if (data && data.details) {
          this.estimationDetails = data.details;
          this.calculateTotal();
        } else {
          this.estimationDetails = [];
          this.estimationTotal = 0;
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.estimationDetails = [];
        this.estimationTotal = 0;
        this.cdr.detectChanges();
      }
    });
  }

  calculateTotal(): void {
    this.estimationTotal = this.estimationDetails.reduce((sum, item) => sum + (item.quantity * item.priceAtTransaction), 0);
  }

  saveAssignmentAndEstimation(): void {
    if (!this.workOrder || !this.selectedMechanicId) return;

    this.isSaving = true;
    this.cdr.detectChanges();

    this.woService.assignMechanic(this.workOrder.id!, this.selectedMechanicId, this.woNotes).subscribe({
      next: () => {
        this.workOrder.mechanicId = this.selectedMechanicId!;
        const mech = this.mechanics.find(m => m.id === this.selectedMechanicId);
        if (mech) this.workOrder.mechanicName = mech.name;
        this.workOrder.notes = this.woNotes;
        this.isChanged = true;

        const totalMinutes = (this.estimatedHours * 60) + this.estimatedMins;
        if (totalMinutes > 0) {
          this.woService.updateEstimation(this.workOrder.id!, totalMinutes).subscribe({
            next: () => {
              this.workOrder.estimatedMinutes = totalMinutes;
              this.computeEstimatedCompletion(this.workOrder);
              this.snackBar.open('Mekanik, catatan & estimasi waktu berhasil disimpan!', 'OK', { duration: 3000, panelClass: 'snack-success' });
              this.isSaving = false;
              this.cdr.detectChanges();
            },
            error: (err: any) => {
              this.snackBar.open('Mekanik disimpan, tapi estimasi waktu gagal: ' + (err.error || ''), 'Tutup', { duration: 4000, panelClass: 'snack-error' });
              this.isSaving = false;
              this.cdr.detectChanges();
            }
          });
        } else {
          this.snackBar.open('Mekanik & catatan berhasil disimpan!', 'OK', { duration: 3000, panelClass: 'snack-success' });
          this.isSaving = false;
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.snackBar.open('Gagal menyimpan penugasan mekanik', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
        this.isSaving = false;
        this.cdr.detectChanges();
      }
    });
  }

  showAddItemModal(): void {
    if (!this.workOrder) return;

    const dialogRef = this.dialog.open(EstimateDialogComponent, {
      width: '560px'
    });

    dialogRef.afterClosed().subscribe(item => {
      if (item) {
        const existing = this.estimationDetails.find(d => d.productId === item.productId);
        if (existing) {
          existing.quantity += item.quantity;
          existing.subtotal = existing.quantity * existing.priceAtTransaction;
        } else {
          this.estimationDetails.push(item);
        }

        this.calculateTotal();
        this.saveEstimationToBackend();
      }
    });
  }

  deleteItem(index: number): void {
    this.estimationDetails.splice(index, 1);
    this.calculateTotal();
    this.saveEstimationToBackend();
  }

  saveEstimationToBackend(): void {
    if (!this.workOrder) return;

    const payload = this.estimationDetails.map(d => ({
      productId: d.productId,
      quantity: d.quantity,
      priceAtTransaction: d.priceAtTransaction
    }));

    this.woService.saveEstimation(this.workOrder.id!, payload).subscribe({
      next: () => {
        this.snackBar.open('Estimasi biaya berhasil diperbarui!', 'OK', { duration: 2500, panelClass: 'snack-success' });
        this.loadEstimationDetails(this.workOrder.id!);
        this.isChanged = true;
      },
      error: (err: any) => {
        const errMsg = err.error || 'Gagal menyimpan estimasi';
        this.snackBar.open(errMsg, 'Tutup', { duration: 3000, panelClass: 'snack-error' });
        this.loadEstimationDetails(this.workOrder.id!);
      }
    });
  }

  onDurationChange(): void {
    if (this.workOrder) {
      this.computeEstimatedCompletion(this.workOrder);
    }
  }

  computeEstimatedCompletion(wo: WorkOrder): void {
    const totalMinutes = (this.estimatedHours * 60) + this.estimatedMins;
    if (!totalMinutes || !wo.startTime) {
      this.computedCompletion = '';
      return;
    }
    const start = new Date(wo.startTime);
    start.setMinutes(start.getMinutes() + totalMinutes);
    this.computedCompletion = start.toLocaleString('id-ID', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false
    }) + ' WIB';
  }

  completeWO(): void {
    if (!this.workOrder) return;

    this.woService.completeWorkOrder(this.workOrder.id!).subscribe({
      next: () => {
        this.snackBar.open('Servis selesai! Tiket dikirim ke Kasir.', 'OK', { duration: 4000, panelClass: 'snack-success' });
        this.dialogRef.close({ reload: true });
      },
      error: () => {
        this.snackBar.open('Gagal memproses status selesai', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
      }
    });
  }

  onClose(): void {
    this.dialogRef.close({ reload: this.isChanged });
  }
}
