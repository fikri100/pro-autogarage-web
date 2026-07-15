import { Component, OnInit, ChangeDetectorRef, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';

import { CashierService } from '../cashier.service';
import { InvoicePrintDialogComponent } from './invoice-print-dialog.component';
import { ConfirmationDialogComponent } from '../../../components/confirmation-dialog.component';
import { EstimateDialogComponent } from '../../work-order/components/estimate-dialog.component';

export interface CashierDetailData {
  workOrder: any;
}

@Component({
  selector: 'app-cashier-detail',
  templateUrl: '../views/cashier-detail.html',
  standalone: false
})
export class CashierDetailComponent implements OnInit {
  workOrder: any;
  transaction: any = null;
  loading = false;
  submitting = false;
  selectedTabIndex = 0;

  // Checkout Inputs
  discount = 0;
  cashAmount = 0;
  changeAmount = 0;
  paymentMethod: 'Tunai' | 'Transfer Bank' | 'QRIS' = 'Tunai';

  // Computed Values
  subtotal = 0;
  taxAmount = 0;
  grandTotal = 0;
  invoiceDetails: any[] = [];
  dataSource = new MatTableDataSource<any>([]);

  displayedColumns = ['code', 'name', 'qty', 'price', 'subtotal', 'actions'];

  constructor(
    private cashierService: CashierService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    public dialogRef: MatDialogRef<CashierDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CashierDetailData
  ) {
    this.workOrder = data.workOrder;
  }

  ngOnInit(): void {
    this.loadTransaction();
  }

  loadTransaction(): void {
    if (!this.workOrder?.id) return;
    this.loading = true;
    this.cdr.detectChanges();

    this.cashierService.getTransactionByWO(this.workOrder.id).subscribe({
      next: (data: any) => {
        this.transaction = data;
        this.invoiceDetails = data?.details ? [...data.details] : [];
        this.dataSource.data = this.invoiceDetails;
        this.discount = 0;
        this.cashAmount = 0;
        this.paymentMethod = 'Tunai';
        this.calculateTotals();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.snackBar.open('Gagal memuat rincian estimasi biaya', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  calculateTotals(): void {
    if (!this.transaction || !this.invoiceDetails) {
      this.subtotal = 0;
      this.taxAmount = 0;
      this.grandTotal = 0;
      this.changeAmount = 0;
      return;
    }

    this.subtotal = this.invoiceDetails.reduce(
      (sum: number, item: any) => sum + (item.quantity * item.priceAtTransaction), 0
    );

    const net = this.subtotal - this.discount;
    const cleanNet = net > 0 ? net : 0;

    this.taxAmount = cleanNet * 0.11;
    this.grandTotal = cleanNet + this.taxAmount;

    if (this.paymentMethod !== 'Tunai') {
      this.cashAmount = this.grandTotal;
    }

    this.calculateChange();
  }

  calculateChange(): void {
    if (this.cashAmount >= this.grandTotal) {
      this.changeAmount = this.cashAmount - this.grandTotal;
    } else {
      this.changeAmount = 0;
    }
  }

  onDiscountChange(): void {
    if (this.discount < 0) this.discount = 0;
    if (this.discount > this.subtotal) this.discount = this.subtotal;
    this.calculateTotals();
  }

  onCashAmountChange(): void {
    if (this.cashAmount < 0) this.cashAmount = 0;
    this.calculateChange();
  }

  changePaymentMethod(method: 'Tunai' | 'Transfer Bank' | 'QRIS'): void {
    this.paymentMethod = method;
    if (method !== 'Tunai') {
      this.cashAmount = this.grandTotal;
    } else {
      this.cashAmount = 0;
    }
    this.calculateTotals();
  }

  increaseQty(index: number): void {
    const item = this.invoiceDetails[index];
    if (item.productType === 'SPR' && item.quantity >= item.stockQuantity) {
      this.snackBar.open('Tidak bisa melebihi stok yang tersedia!', 'Tutup', { duration: 2500, panelClass: 'snack-error' });
      return;
    }
    item.quantity++;
    item.subtotal = item.quantity * item.priceAtTransaction;
    this.invoiceDetails = [...this.invoiceDetails];
    this.dataSource.data = this.invoiceDetails;
    this.calculateTotals();
    this.cdr.detectChanges();
  }

  decreaseQty(index: number): void {
    const item = this.invoiceDetails[index];
    if (item.quantity <= 1) return;
    item.quantity--;
    item.subtotal = item.quantity * item.priceAtTransaction;
    this.invoiceDetails = [...this.invoiceDetails];
    this.dataSource.data = this.invoiceDetails;
    this.calculateTotals();
    this.cdr.detectChanges();
  }

  deleteItem(index: number): void {
    const item = this.invoiceDetails[index];
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '440px',
      data: {
        title: 'Hapus Item Pembayaran',
        message: `Apakah Anda yakin ingin menghapus "${item.productName}" dari daftar tagihan/invoice?`,
        confirmText: 'Hapus',
        cancelText: 'Batal',
        warn: true
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.invoiceDetails.splice(index, 1);
        this.invoiceDetails = [...this.invoiceDetails]; // Trigger change detection
        this.dataSource.data = this.invoiceDetails;
        this.calculateTotals();
        this.cdr.detectChanges();
      }
    });
  }

  showAddItemModal(): void {
    if (!this.transaction) return;

    const dialogRef = this.dialog.open(EstimateDialogComponent, {
      width: '560px'
    });

    dialogRef.afterClosed().subscribe(item => {
      if (item) {
        const existing = this.invoiceDetails.find((d: any) => d.productId === item.productId);
        if (existing) {
          existing.quantity += item.quantity;
          existing.subtotal = existing.quantity * existing.priceAtTransaction;
        } else {
          this.invoiceDetails.push(item);
        }

        // Trigger change detection for mat-table by creating a new array reference
        this.invoiceDetails = [...this.invoiceDetails];
        this.dataSource.data = this.invoiceDetails;
        this.calculateTotals();
        this.cdr.detectChanges();
      }
    });
  }

  payAndPrint(): void {
    if (this.paymentMethod === 'Tunai' && this.cashAmount < this.grandTotal) {
      this.snackBar.open('Uang yang diterima kurang dari total tagihan!', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
      return;
    }

    this.submitting = true;
    this.cdr.detectChanges();

    const payload = {
      paymentMethod: this.paymentMethod,
      discount: this.discount,
      details: this.invoiceDetails.map((d: any) => ({
        productId: d.productId,
        quantity: d.quantity,
        priceAtTransaction: d.priceAtTransaction
      }))
    };

    this.cashierService.payInvoice(this.transaction.id, payload).subscribe({
      next: () => {
        this.snackBar.open('Pembayaran berhasil diproses!', 'OK', { duration: 3000, panelClass: 'snack-success' });

        const printedTransaction = {
          ...this.transaction,
          details: this.invoiceDetails,
          paymentMethod: this.paymentMethod,
          discount: this.discount,
          totalAmount: this.grandTotal,
          transactionDate: new Date()
        };

        const printDialog = this.dialog.open(InvoicePrintDialogComponent, {
          width: '420px',
          disableClose: true,
          data: {
            transaction: printedTransaction,
            cashAmount: this.cashAmount
          }
        });

        printDialog.afterClosed().subscribe(() => {
          this.submitting = false;
          this.dialogRef.close({ reload: true });
        });
      },
      error: (err: any) => {
        const errMsg = err.error || 'Gagal memproses pembayaran invoice';
        this.snackBar.open(errMsg, 'Tutup', { duration: 3000, panelClass: 'snack-error' });
        this.submitting = false;
        this.cdr.detectChanges();
      }
    });
  }

  goToPayment(): void {
    this.selectedTabIndex = 1;
  }

  onClose(): void {
    this.dialogRef.close({ reload: false });
  }
}
