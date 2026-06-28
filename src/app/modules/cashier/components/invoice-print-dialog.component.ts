import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { jsPDF } from 'jspdf';

export interface PrintDialogData {
  transaction: any;
  cashAmount: number;
}

@Component({
  selector: 'app-invoice-print-dialog',
  templateUrl: '../views/invoice-print-dialog.html',
  standalone: false,
  encapsulation: ViewEncapsulation.None
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
  ) { }

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
    // 1. Generate and Download PDF
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Colors
      const primaryColor = [30, 41, 59]; // Slate-800
      const secondaryColor = [100, 116, 139]; // Slate-500
      const accentColor = [16, 185, 129]; // Emerald-500 (Status PAID)
      const lightBg = [248, 250, 252]; // Slate-50
      const borderColor = [226, 232, 240]; // Slate-200

      // Helper to format currency
      const formatRp = (val: number) => 'Rp ' + Math.round(val).toLocaleString('id-ID');

      // Helper to format date
      const formatDate = (dateInput: any) => {
        if (!dateInput) return '-';
        const d = new Date(dateInput);
        return d.toLocaleDateString('id-ID', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }) + ' ' + d.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit'
        }) + ' WIB';
      };

      // --- HEADER ---
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('PRO AUTO GARAGE', 15, 25);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text('Jalan Raya Otomotif No. 88, Jakarta', 15, 30);
      doc.text('Telp/WA: +62 812-3456-7890', 15, 34);

      // --- STATUS ---
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.text('INVOICE / NOTA LUNAS', 195, 25, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text('Status: LUNAS (PAID)', 195, 30, { align: 'right' });

      // Divider
      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      doc.setLineWidth(0.4);
      doc.line(15, 38, 195, 38);

      // --- METADATA ---
      // Customer Info (Left column)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text('INFORMASI PELANGGAN:', 15, 45);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('Nama: ' + (this.t.customerName || 'Walk-in Customer'), 15, 50);
      doc.text('Kendaraan: ' + (this.t.brand || '') + ' ' + (this.t.model || ''), 15, 55);
      doc.text('No. Polisi: ' + (this.t.licensePlate || '-'), 15, 60);

      // Invoice Info (Right column)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text('RINCIAN INVOICE:', 120, 45);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('No. Invoice: ' + (this.t.invoiceNumber || '-'), 120, 50);
      doc.text('Tanggal: ' + formatDate(this.t.transactionDate), 120, 55);
      doc.text('Metode Bayar: ' + (this.t.paymentMethod || 'Tunai'), 120, 60);

      // --- TABLE OF ITEMS ---
      const tableStartY = 70;

      // Header Background
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(15, tableStartY, 180, 8, 'F');

      // Header Text
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('NO', 18, tableStartY + 5.5);
      doc.text('NAMA ITEM (LAYANAN / SPAREPART)', 30, tableStartY + 5.5);
      doc.text('QTY', 125, tableStartY + 5.5, { align: 'center' });
      doc.text('HARGA SATUAN', 155, tableStartY + 5.5, { align: 'right' });
      doc.text('SUBTOTAL', 190, tableStartY + 5.5, { align: 'right' });

      // Rows
      let currentY = tableStartY + 8;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);

      const details = this.t.details || [];
      details.forEach((item: any, i: number) => {
        // Alternating background
        if (i % 2 === 1) {
          doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
          doc.rect(15, currentY, 180, 8, 'F');
        }

        // Draw text
        doc.text((i + 1).toString(), 18, currentY + 5.5);
        doc.text(item.productName || '-', 30, currentY + 5.5);
        doc.text(item.quantity.toString(), 125, currentY + 5.5, { align: 'center' });
        doc.text(formatRp(item.priceAtTransaction), 155, currentY + 5.5, { align: 'right' });

        const itemSubtotal = item.quantity * item.priceAtTransaction;
        doc.text(formatRp(itemSubtotal), 190, currentY + 5.5, { align: 'right' });

        // Draw line
        doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
        doc.setLineWidth(0.2);
        doc.line(15, currentY + 8, 195, currentY + 8);

        currentY += 8;
      });

      // --- FINANCIAL SUMMARY ---
      currentY += 5;
      doc.setFontSize(9.5);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);

      // Subtotal
      doc.setFont('helvetica', 'normal');
      doc.text('Subtotal:', 145, currentY, { align: 'right' });
      doc.text(formatRp(this.subtotal), 190, currentY, { align: 'right' });

      // Discount (if > 0)
      if (this.t.discount > 0) {
        currentY += 5.5;
        doc.text('Diskon:', 145, currentY, { align: 'right' });
        doc.text('-' + formatRp(this.t.discount), 190, currentY, { align: 'right' });
      }

      // Tax
      currentY += 5.5;
      doc.text('PPN (11%):', 145, currentY, { align: 'right' });
      doc.text(formatRp(this.tax), 190, currentY, { align: 'right' });

      // Divider for Total
      currentY += 3;
      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      doc.setLineWidth(0.4);
      doc.line(120, currentY, 195, currentY);

      // Total Tagihan
      currentY += 6;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('TOTAL TAGIHAN:', 145, currentY, { align: 'right' });
      doc.text(formatRp(this.t.totalAmount), 190, currentY, { align: 'right' });

      // Payment Details
      currentY += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.text('Uang Diterima:', 145, currentY, { align: 'right' });
      doc.text(formatRp(this.cashAmount), 190, currentY, { align: 'right' });

      currentY += 5.5;
      doc.setFont('helvetica', 'bold');
      doc.text('Kembalian:', 145, currentY, { align: 'right' });
      doc.text(formatRp(this.changeAmount), 190, currentY, { align: 'right' });

      // --- FOOTER & SIGNATURES ---
      // Signature Section (only if there is space on the page, else shift or fixed)
      const sigY = Math.max(currentY + 20, 220);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);

      doc.text('Penerima / Pelanggan,', 30, sigY);
      doc.line(20, sigY + 22, 70, sigY + 22);

      doc.text('Hormat Kami (Kasir),', 150, sigY);
      doc.line(140, sigY + 22, 185, sigY + 22);

      // Bottom terms
      doc.setFontSize(8);
      doc.text('GARANSI SERVIS: 7 HARI / 100 KM', 105, 275, { align: 'center' });
      doc.text('Terima kasih atas kunjungan Anda di Pro Auto Garage', 105, 279, { align: 'center' });

      // Auto print setup and open PDF in new tab
      doc.autoPrint();
      const pdfUrl = doc.output('bloburl');
      window.open(pdfUrl, '_blank');
    } catch (pdfErr) {
      console.error('Gagal generate PDF:', pdfErr);
    }
  }

  closeDialog(): void {
    this.dialogRef.close(true);
  }
}
