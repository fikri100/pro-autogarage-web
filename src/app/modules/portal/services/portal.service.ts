import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PortalService {
  private readonly PORTAL_SESSION_KEY = 'pro_auto_garage_portal_session';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  sendOTP(phone: string): Observable<any> {
    return this.http.post<any>('/api/portal/send-otp', { phone });
  }

  verifyOTP(phone: string, otpCode: string): Observable<any> {
    return this.http.post<any>('/api/portal/verify-otp', { phone, otpCode });
  }

  register(payload: any): Observable<any> {
    return this.http.post<any>('/api/portal/register', payload);
  }

  login(usernameOrPhone: string, password: string): Observable<any> {
    return this.http.post<any>('/api/portal/login', { usernameOrPhone, password }).pipe(
      tap((customer: any) => {
        localStorage.setItem(this.PORTAL_SESSION_KEY, JSON.stringify(customer));
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.PORTAL_SESSION_KEY);
    this.router.navigate(['/portal/login']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem(this.PORTAL_SESSION_KEY);
  }

  get currentCustomer(): any | null {
    const session = localStorage.getItem(this.PORTAL_SESSION_KEY);
    if (!session) return null;
    try {
      return JSON.parse(session);
    } catch {
      localStorage.removeItem(this.PORTAL_SESSION_KEY);
      return null;
    }
  }

  private getAuthHeaders(): HttpHeaders {
    const cust = this.currentCustomer;
    const id = cust ? cust.id : 0;
    return new HttpHeaders().set('X-Customer-ID', id.toString());
  }

  createBooking(booking: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>('/api/portal/bookings', booking, { headers });
  }

  getBookings(): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>('/api/portal/bookings', { headers });
  }

  getDashboardSummary(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>('/api/portal/dashboard/summary', { headers });
  }

  getVehicles(): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>('/api/portal/vehicles', { headers });
  }

  addVehicle(vehicle: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>('/api/portal/vehicles', vehicle, { headers });
  }

  updateVehicle(id: number, vehicle: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put<any>(`/api/portal/vehicles/${id}`, vehicle, { headers });
  }

  deleteVehicle(id: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete<any>(`/api/portal/vehicles/${id}`, { headers });
  }

  getProfile(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>('/api/portal/profile', { headers });
  }

  updateProfile(profile: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put<any>('/api/portal/profile', profile, { headers });
  }

  cancelBooking(id: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put<any>(`/api/portal/bookings/${id}/cancel`, {}, { headers });
  }

  getBookedSlots(date: string): Observable<string[]> {
    return this.http.get<string[]>(`/api/bookings/booked-slots?date=${date}`);
  }

  getParamsByGroup(group: string): Observable<any[]> {
    return this.http.get<any[]>(`/api/params?group_param=${group}`);
  }
}
