import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DashboardSummary } from '../models/dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private dashboardUrl = '/api/dashboard';
  private bookingUrl = '/api/bookings';

  constructor(private http: HttpClient) {}

  getSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.dashboardUrl}/summary`);
  }

  approveBooking(id: number): Observable<void> {
    return this.http.put<void>(`${this.bookingUrl}/${id}/confirm`, {});
  }

  cancelBooking(id: number): Observable<void> {
    return this.http.put<void>(`${this.bookingUrl}/${id}/cancel`, {});
  }
}
