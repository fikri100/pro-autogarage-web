import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Booking } from './models/object';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private bookingsUrl = '/api/bookings';
  private customersUrl = '/api/customers';
  private vehiclesUrl = '/api/vehicles';

  constructor(private http: HttpClient) {}

  getBookings(status?: string): Observable<Booking[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<Booking[]>(this.bookingsUrl, { params });
  }

  createBooking(booking: Booking): Observable<Booking> {
    return this.http.post<Booking>(this.bookingsUrl, booking);
  }

  confirmBooking(id: number): Observable<void> {
    return this.http.put<void>(`${this.bookingsUrl}/${id}/confirm`, {});
  }

  cancelBooking(id: number): Observable<void> {
    return this.http.put<void>(`${this.bookingsUrl}/${id}/cancel`, {});
  }

  // Support helpers
  getCustomers(): Observable<any[]> {
    return this.http.get<any[]>(this.customersUrl);
  }

  getVehicles(): Observable<any[]> {
    return this.http.get<any[]>(this.vehiclesUrl);
  }
}
