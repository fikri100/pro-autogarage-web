import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { WorkOrderService } from '../work-order.service';
import { WorkOrder } from '../models/object';
import { EstimateDialogComponent } from './estimate-dialog.component';

@Component({
  selector: 'app-work-order-list',
  templateUrl: '../views/work-order.html',
  standalone: false
})
export class WorkOrderComponent implements OnInit {
  workOrders: WorkOrder[] = [];
  loading = false;
  selectedWO: WorkOrder | null = null;

  mechanics: any[] = [];
  estimationDetails: any[] = [];
  estimationTotal = 0;
  
  // Fields for assigned mechanic inline
  selectedMechanicId: number | null = null;
  woNotes = '';

  // Fields for work duration estimation
  estimatedHours: number = 0;
  estimatedMins: number = 0;
  computedCompletion: string = '';

  detailsColumns: string[] = ['code', 'name', 'type', 'qty', 'price', 'subtotal', 'actions'];

  constructor(
    private woService: WorkOrderService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadWorkOrders();
    this.loadMechanics();
  }

  loadMechanics(): void {
    this.woService.getMechanics().subscribe(data => {
      this.mechanics = (data || []).filter((m: any) => 
        m.position?.toLowerCase().includes('mechanic') || 
        m.position?.toLowerCase().includes('mekanik')
      );
    });
  }

  loadWorkOrders(): void {
    this.loading = true;
    this.cdr.detectChanges();

    this.woService.getWorkOrders().subscribe({
      next: (data: WorkOrder[]) => {
        this.workOrders = data || [];
        
        if (this.workOrders.length > 0) {
          const exists = this.workOrders.find(w => w.id === this.selectedWO?.id);
          this.selectWorkOrder(exists || this.workOrders[0]);
        } else {
          this.selectedWO = null;
          this.estimationDetails = [];
          this.estimationTotal = 0;
        }

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error loading work orders:', err);
        this.snackBar.open('Gagal memuat tiket Work Order', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  selectWorkOrder(wo: WorkOrder): void {
    this.selectedWO = wo;
    this.selectedMechanicId = wo.mechanicId || null;
    this.woNotes = wo.notes || '';
    this.estimationDetails = [];
    this.estimationTotal = 0;

    // Populate duration estimation fields from saved data
    if (wo.estimatedMinutes) {
      this.estimatedHours = Math.floor(wo.estimatedMinutes / 60);
      this.estimatedMins = wo.estimatedMinutes % 60;
    } else {
      this.estimatedHours = 0;
      this.estimatedMins = 0;
    }
    this.computeEstimatedCompletion(wo);
    
    this.loadEstimationDetails(wo.id!);
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
        // 404 means no draft invoice has been created yet, which is normal for a brand new WO
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
    if (!this.selectedWO || !this.selectedMechanicId) return;

    // Step 1: Save mechanic assignment
    this.woService.assignMechanic(this.selectedWO.id!, this.selectedMechanicId, this.woNotes).subscribe({
      next: () => {
        // Update local object for mechanic
        this.selectedWO!.mechanicId = this.selectedMechanicId!;
        const mech = this.mechanics.find(m => m.id === this.selectedMechanicId);
        if (mech) this.selectedWO!.mechanicName = mech.name;
        this.selectedWO!.notes = this.woNotes;

        // Step 2: Save estimation duration (only if > 0)
        const totalMinutes = (this.estimatedHours * 60) + this.estimatedMins;
        if (totalMinutes > 0) {
          this.woService.updateEstimation(this.selectedWO!.id!, totalMinutes).subscribe({
            next: () => {
              this.selectedWO!.estimatedMinutes = totalMinutes;
              this.computeEstimatedCompletion(this.selectedWO!);
              this.snackBar.open('Mekanik, catatan & estimasi waktu berhasil disimpan!', 'OK', { duration: 3000, panelClass: 'snack-success' });
              this.cdr.detectChanges();
            },
            error: (err: any) => {
              this.snackBar.open('Mekanik disimpan, tapi estimasi waktu gagal: ' + (err.error || ''), 'Tutup', { duration: 4000, panelClass: 'snack-error' });
            }
          });
        } else {
          this.snackBar.open('Mekanik & catatan berhasil disimpan!', 'OK', { duration: 3000, panelClass: 'snack-success' });
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.snackBar.open('Gagal menyimpan penugasan mekanik', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
      }
    });
  }

  showAddItemModal(): void {
    if (!this.selectedWO) return;

    const dialogRef = this.dialog.open(EstimateDialogComponent, {
      width: '560px'
    });

    dialogRef.afterClosed().subscribe(item => {
      if (item) {
        // Check if product is already in our estimate, if so just merge quantity
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
    if (!this.selectedWO) return;

    const payload = this.estimationDetails.map(d => ({
      productId: d.productId,
      quantity: d.quantity,
      priceAtTransaction: d.priceAtTransaction
    }));

    this.woService.saveEstimation(this.selectedWO.id!, payload).subscribe({
      next: () => {
        this.snackBar.open('Estimasi biaya berhasil diperbarui!', 'OK', { duration: 2500, panelClass: 'snack-success' });
        this.loadEstimationDetails(this.selectedWO!.id!);
      },
      error: (err: any) => {
        const errMsg = err.error || 'Gagal menyimpan estimasi';
        this.snackBar.open(errMsg, 'Tutup', { duration: 3000, panelClass: 'snack-error' });
        // Reload details to reset back to actual state
        this.loadEstimationDetails(this.selectedWO!.id!);
      }
    });
  }

  onDurationChange(): void {
    if (this.selectedWO) {
      this.computeEstimatedCompletion(this.selectedWO);
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

  saveWorkDurationEstimation(): void {
    if (!this.selectedWO) return;
    const totalMinutes = (this.estimatedHours * 60) + this.estimatedMins;
    if (totalMinutes <= 0) {
      this.snackBar.open('Durasi estimasi harus lebih dari 0 menit', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
      return;
    }

    this.woService.updateEstimation(this.selectedWO.id!, totalMinutes).subscribe({
      next: () => {
        this.snackBar.open('Estimasi waktu berhasil disimpan!', 'OK', { duration: 3000, panelClass: 'snack-success' });
        this.selectedWO!.estimatedMinutes = totalMinutes;
        // Recalculate display from saved startTime
        this.computeEstimatedCompletion(this.selectedWO!);
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.snackBar.open(err.error || 'Gagal menyimpan estimasi waktu', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
      }
    });
  }

  completeWO(): void {
    if (!this.selectedWO) return;

    this.woService.completeWorkOrder(this.selectedWO.id!).subscribe({
      next: () => {
        this.snackBar.open('Servis selesai! Tiket dikirim ke Kasir.', 'OK', { duration: 4000, panelClass: 'snack-success' });
        this.loadWorkOrders();
      },
      error: () => {
        this.snackBar.open('Gagal memproses status selesai', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
      }
    });
  }
}
