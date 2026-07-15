import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PortalService } from '../services/portal.service';

@Component({
  selector: 'app-portal-profile',
  templateUrl: '../views/portal-profile.html',
  standalone: false
})
export class PortalProfileComponent implements OnInit {
  profileForm!: FormGroup;
  loading = false;
  isSaving = false;
  customerPhone = '';
  hideCurrentPassword = true;
  hideNewPassword = true;
  hideConfirmPassword = true;

  constructor(
    private fb: FormBuilder,
    private portalService: PortalService,
    private snackBar: MatSnackBar,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const customer = this.portalService.currentCustomer;
    if (!customer) {
      this.router.navigate(['/portal/login']);
      return;
    }
    this.initForm();
    this.loadProfile();
  }

  private initForm(): void {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required]],
      username: ['', [Validators.required]],
      address: ['', [Validators.required, Validators.minLength(5)]],
      currentPassword: [''],
      newPassword: [''],
      confirmPassword: ['']
    });
  }

  loadProfile(): void {
    this.loading = true;
    this.cdr.detectChanges();
    this.portalService.getProfile().subscribe({
      next: (data) => {
        if (data) {
          this.customerPhone = data.phone;
          this.profileForm.patchValue({
            name: data.name,
            username: data.username || '',
            address: data.address || ''
          });
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load profile:', err);
        this.snackBar.open('Gagal memuat profil!', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const { name, username, address, currentPassword, newPassword, confirmPassword } = this.profileForm.value;
    
    // Validate password change
    const isChangingPassword = !!newPassword || !!confirmPassword;
    if (isChangingPassword) {
      if (!currentPassword) {
        this.snackBar.open('Kata sandi saat ini wajib diisi untuk mengubah kata sandi baru!', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
        return;
      }
      if (newPassword !== confirmPassword) {
        this.snackBar.open('Konfirmasi kata sandi baru tidak cocok!', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
        return;
      }
      if (newPassword.length < 6) {
        this.snackBar.open('Kata sandi baru minimal 6 karakter!', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
        return;
      }
    }

    this.isSaving = true;
    this.cdr.detectChanges();

    const payload: any = { name, username, address };
    if (isChangingPassword) {
      payload.currentPassword = currentPassword;
      payload.newPassword = newPassword;
    }

    this.portalService.updateProfile(payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.snackBar.open('Profil berhasil diperbarui!', 'OK', { duration: 3000, panelClass: 'snack-success' });
        
        // Sync local storage session to update Navbar/Topbar in real time
        this.updateLocalSession(name, username);
        
        // Clear password fields
        this.profileForm.patchValue({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        
        this.loadProfile();
      },
      error: (err) => {
        this.isSaving = false;
        const msg = err.error && err.error.error ? err.error.error : 'Gagal memperbarui profil!';
        this.snackBar.open(msg, 'Tutup', { duration: 3000, panelClass: 'snack-error' });
        this.cdr.detectChanges();
      }
    });
  }

  private updateLocalSession(name: string, username: string): void {
    const session = localStorage.getItem('pro_auto_garage_portal_session');
    if (session) {
      try {
        const cust = JSON.parse(session);
        cust.name = name;
        cust.username = username;
        localStorage.setItem('pro_auto_garage_portal_session', JSON.stringify(cust));
      } catch (e) {
        console.error('Failed to sync session storage:', e);
      }
    }
  }
}
