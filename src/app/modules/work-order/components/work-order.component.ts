import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageEvent } from '@angular/material/paginator';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { WorkOrderService } from '../work-order.service';
import { WorkOrder } from '../models/object';
import { WorkOrderDetailComponent } from './work-order-detail.component';

@Component({
  selector: 'app-work-order-list',
  templateUrl: '../views/work-order.html',
  standalone: false
})
export class WorkOrderComponent implements OnInit, OnDestroy {
  workOrders: WorkOrder[] = [];
  filteredWorkOrders: WorkOrder[] = [];
  loading = false;

  totalData = 0;
  currentPage = 1;
  pageSize = 10;
  searchQuery = '';
  private searchSubject = new Subject<string>();
  private searchSubscription!: Subscription;

  displayedColumns: string[] = ['id', 'plate', 'customer', 'vehicle', 'startTime', 'mechanic', 'status', 'actions'];

  constructor(
    private woService: WorkOrderService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(1000)
    ).subscribe(searchValue => {
      this.searchQuery = searchValue;
      this.currentPage = 1;
      this.loadWorkOrders();
    });
    this.loadWorkOrders();
  }

  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  loadWorkOrders(): void {
    this.loading = true;
    this.cdr.detectChanges();

    this.woService.getWorkOrders(this.searchQuery, this.currentPage, this.pageSize).subscribe({
      next: (res: any) => {
        this.workOrders = res.data || [];
        this.totalData = res.pageResponse?.total || 0;
        this.filteredWorkOrders = [...this.workOrders];
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

  openWorkOrderDetail(wo: WorkOrder): void {
    const dialogRef = this.dialog.open(WorkOrderDetailComponent, {
      width: '85vw',
      maxWidth: '950px',
      data: { workOrder: wo }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.reload) {
        this.loadWorkOrders();
      }
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.searchSubject.next(filterValue);
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadWorkOrders();
  }
}
