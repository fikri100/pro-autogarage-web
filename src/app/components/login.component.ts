import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: '../views/login.html',
  standalone: false
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // If already logged in, redirect to home immediately
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
      return;
    }
    this.initForm();
  }

  private initForm(): void {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.loading = true;

    const { username, password } = this.loginForm.value;
    this.authService.login(username, password).subscribe({
      next: () => {
        this.loading = false;
        this.snackBar.open('Selamat datang kembali di Pro Auto Garage!', 'OK', { duration: 3000, panelClass: 'snack-success' });
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        let errMsg = 'Username atau password salah!';
        if (err.status === 0 || err.status === 500) {
          errMsg = 'Gagal terhubung ke server API!';
        }
        this.snackBar.open(errMsg, 'Tutup', { duration: 3000, panelClass: 'snack-error' });
      }
    });
  }
}
