import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageEvent } from '@angular/material/paginator';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { CashierService } from '../cashier.service';
import { CashierDetailComponent } from './cashier-detail.component';

@Component({
  selector: 'app-cashier-checkout',
  templateUrl: '../views/cashier.html',
  standalone: false
})
export class CashierComponent implements OnInit, OnDestroy {
  readyWOs: any[] = [];
  loading = false;

  totalData = 0;
  currentPage = 1;
  pageSize = 10;
  searchQuery = '';
  private searchSubject = new Subject<string>();
  private searchSubscription!: Subscription;

  displayedColumns = ['invoice', 'plate', 'customer', 'vehicle', 'mechanic', 'status', 'actions'];

  constructor(
    private cashierService: CashierService,
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
      this.loadReadyWOs();
    });
    this.loadReadyWOs();
  }

  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  loadReadyWOs(): void {
    this.loading = true;
    this.cdr.detectChanges();

    this.cashierService.getReadyWorkOrders(this.searchQuery, this.currentPage, this.pageSize).subscribe({
      next: (res: any) => {
        this.readyWOs = res.data || [];
        this.totalData = res.pageResponse?.total || 0;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.snackBar.open('Gagal memuat daftar kasir', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  openCashierDetail(wo: any): void {
    const dialogRef = this.dialog.open(CashierDetailComponent, {
      width: '85vw',
      maxWidth: '950px',
      data: { workOrder: wo }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.reload) {
        this.loadReadyWOs();
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
    this.loadReadyWOs();
  }
}
