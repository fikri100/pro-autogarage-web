import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface PrintDialogData {
  transaction: any;
  cashAmount: number;
}

@Component({
  selector: 'app-invoice-print-dialog',
  templateUrl: '../views/invoice-print-dialog.html',
  styleUrls: ['./invoice-print-dialog.css'],
  standalone: false
})
export class InvoicePrintDialogComponent implements OnInit {
  t: any = null;
  cashAmount = 0;
  changeAmount = 0;
  subtotal = 0;
  tax = 0;

  constructor(
    public dialogRef: MatDialogRef<InvoicePrintDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PrintDialogData
  ) {}

  ngOnInit(): void {
    this.t = this.data.transaction;
    this.cashAmount = this.data.cashAmount;

    // Calculate subtotal
    this.subtotal = this.t.details.reduce((sum: number, item: any) => sum + (item.quantity * item.priceAtTransaction), 0);
    const net = this.subtotal - this.t.discount;
    this.tax = net > 0 ? net * 0.11 : 0;
    
    // grandTotal = net + tax
    const grandTotal = net + this.tax;
    this.changeAmount = this.cashAmount > grandTotal ? this.cashAmount - grandTotal : 0;
  }

  printReceipt(): void {
    window.print();
  }

  closeDialog(): void {
    this.dialogRef.close(true);
  }
}
