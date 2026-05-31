import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Booking } from './models/object';
import { PaginatedResponse } from '../../models/pagination.model';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private bookingsUrl = '/api/bookings';
  private customersUrl = '/api/customers';
  private vehiclesUrl = '/api/vehicles';

  constructor(private http: HttpClient) {}

  getBookings(search: string = '', status?: string, page: number = 1, limit: number = 10): Observable<PaginatedResponse<Booking>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('search', search);

    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<PaginatedResponse<Booking>>(this.bookingsUrl, { params });
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
  getCustomers(limit: number = 1000): Observable<any> {
    const params = new HttpParams().set('page', '1').set('limit', limit.toString());
    return this.http.get<any>(this.customersUrl, { params });
  }

  getVehicles(customerId?: number): Observable<any[]> {
    let params = new HttpParams();
    if (customerId) {
      params = params.set('customerId', customerId.toString());
    }
    return this.http.get<any[]>(this.vehiclesUrl, { params });
  }
}
