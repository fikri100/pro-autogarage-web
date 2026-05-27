import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PortalService } from '../services/portal.service';

@Component({
  selector: 'app-portal-login',
  templateUrl: '../views/portal-login.html',
  standalone: false
})
export class PortalLoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private portalService: PortalService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    if (this.portalService.isLoggedIn()) {
      this.router.navigate(['/portal/booking']);
      return;
    }
    this.initForm();
  }

  private initForm(): void {
    this.loginForm = this.fb.group({
      usernameOrPhone: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;
    this.loading = true;

    const { usernameOrPhone, password } = this.loginForm.value;
    this.portalService.login(usernameOrPhone, password).subscribe({
      next: () => {
        this.loading = false;
        this.snackBar.open('Selamat datang di Portal Pelanggan Pro Auto Garage!', 'OK', { duration: 3000, panelClass: 'snack-success' });
        this.router.navigate(['/portal/booking']);
      },
      error: (err) => {
        this.loading = false;
        let errMsg = 'Username/Nomor WA atau password salah!';
        if (err.status === 401 && err.error && err.error.error) {
          errMsg = err.error.error;
        } else if (err.status === 0 || err.status === 500) {
          errMsg = 'Gagal terhubung ke server API!';
        }
        this.snackBar.open(errMsg, 'Tutup', { duration: 3000, panelClass: 'snack-error' });
      }
    });
  }
}
