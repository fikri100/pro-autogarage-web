import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface ConfirmationData {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  warn?: boolean;
}

@Component({
  selector: 'app-confirmation-dialog',
  template: `
    <h2 mat-dialog-title class="dialog-title">
      <mat-icon [class.warn]="data.warn" class="title-icon">{{ data.warn ? 'warning' : 'help_outline' }}</mat-icon>
      <span style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700;">{{ data.title || 'Konfirmasi Tindakan' }}</span>
    </h2>

    <mat-dialog-content class="dialog-content confirm-content">
      <p style="font-family: 'Inter', sans-serif; margin: 0; color: #334155; font-size: 0.95rem; line-height: 1.5;">{{ data.message }}</p>
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="dialog-actions" style="display: flex; gap: 0.5rem; justify-content: flex-end; padding: 0.75rem 1.5rem 1.25rem; border-top: 1px solid #f1f5f9;">
      <button mat-stroked-button [mat-dialog-close]="false" class="btn-secondary" style="font-family: 'Inter', sans-serif; font-weight: 500;">
        {{ data.cancelText || 'Batal' }}
      </button>
      <button mat-flat-button [mat-dialog-close]="true" [color]="data.warn ? 'warn' : 'primary'" class="btn-primary" style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 600;">
        {{ data.confirmText || 'Ya, Setuju' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1.25rem 1.5rem 0.75rem !important;
      border-bottom: 1px solid #f1f5f9;
      margin: 0;
    }
    .title-icon {
      color: #1e3a8a;
      margin-right: 0.25rem;
    }
    .title-icon.warn {
      color: #ef4444;
    }
    .dialog-content {
      padding: 1.5rem 1.5rem 1.25rem !important;
    }
  `],
  standalone: false
})
export class ConfirmationDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmationData
  ) {}
}
