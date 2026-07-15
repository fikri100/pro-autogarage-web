import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PortalService } from '../services/portal.service';

@Component({
  selector: 'app-portal-register',
  templateUrl: '../views/portal-register.html',
  standalone: false
})
export class PortalRegisterComponent implements OnInit {
  step1Form!: FormGroup;
  step2Form!: FormGroup;
  
  step = 1; // Step 1: Phone + OTP, Step 2: Username + Password
  otpSent = false;
  otpVerified = false;
  loading = false;
  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private portalService: PortalService,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.portalService.isLoggedIn()) {
      this.router.navigate(['/portal/booking']);
      return;
    }
    this.initForms();
  }

  private initForms(): void {
    this.step1Form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{9,15}$/)]],
      otpCode: ['', []]
    });

    this.step2Form = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(4), Validators.pattern(/^[a-zA-Z0-9_]+$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      address: ['', [Validators.required, Validators.minLength(5)]]
    });

    // Auto verify when exactly 6 digits are typed
    this.step1Form.get('otpCode')?.valueChanges.subscribe(val => {
      if (val && val.length === 6 && /^[0-9]{6}$/.test(val) && !this.loading && !this.otpVerified) {
        this.verifyOTP();
      }
    });
  }

  sendOTP(): void {
    if (this.step1Form.get('name')?.invalid || this.step1Form.get('phone')?.invalid) {
      this.step1Form.get('name')?.markAsTouched();
      this.step1Form.get('phone')?.markAsTouched();
      return;
    }
    this.loading = true;
    this.cdr.detectChanges();

    const phone = this.step1Form.value.phone;
    this.portalService.sendOTP(phone).subscribe({
      next: () => {
        this.loading = false;
        this.otpSent = true;
        // Make OTP code required now
        this.step1Form.get('otpCode')?.setValidators([Validators.required, Validators.pattern(/^[0-9]{6}$/)]);
        this.step1Form.get('otpCode')?.updateValueAndValidity();
        this.snackBar.open('Kode OTP telah dikirim ke nomor WhatsApp Anda!', 'OK', { duration: 3000, panelClass: 'snack-success' });
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        const msg = err.error && err.error.error ? err.error.error : 'Gagal mengirim OTP!';
        this.snackBar.open(msg, 'Tutup', { duration: 3000, panelClass: 'snack-error' });
        this.cdr.detectChanges();
      }
    });
  }

  verifyOTP(): void {
    if (!this.otpSent) return;
    if (this.step1Form.invalid) {
      this.step1Form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.cdr.detectChanges();

    const { phone, otpCode } = this.step1Form.value;
    this.portalService.verifyOTP(phone, otpCode).subscribe({
      next: () => {
        this.loading = false;
        this.otpVerified = true;
        this.step = 2; // Move to Step 2
        this.snackBar.open('Nomor WhatsApp berhasil diverifikasi! Lanjutkan set-up akun.', 'OK', { duration: 3500, panelClass: 'snack-success' });
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        const msg = err.error && err.error.error ? err.error.error : 'Kode OTP salah atau kedaluwarsa!';
        this.snackBar.open(msg, 'Tutup', { duration: 3000, panelClass: 'snack-error' });
        this.cdr.detectChanges();
      }
    });
  }

  onSubmitRegister(): void {
    if (!this.otpVerified) return;
    if (this.step2Form.invalid) {
      this.step2Form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.cdr.detectChanges();

    const { name, phone } = this.step1Form.value;
    const { username, password, address } = this.step2Form.value;

    const payload = { name, phone, username, password, address };

    this.portalService.register(payload).subscribe({
      next: () => {
        this.loading = false;
        this.snackBar.open('Pendaftaran berhasil! Silakan login menggunakan akun Anda.', 'OK', { duration: 4000, panelClass: 'snack-success' });
        this.router.navigate(['/portal/login']);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        const msg = err.error && err.error.error ? err.error.error : 'Gagal mendaftarkan akun!';
        this.snackBar.open(msg, 'Tutup', { duration: 3000, panelClass: 'snack-error' });
        this.cdr.detectChanges();
      }
    });
  }
}
