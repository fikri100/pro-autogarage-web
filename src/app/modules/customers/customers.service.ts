import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Customer, Vehicle } from './models/object';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private apiUrl = '/api/customers';
  private vehicleUrl = '/api/vehicles';

  constructor(private http: HttpClient) {}

  getCustomers(): Observable<Customer[]> {
    return this.http.get<Customer[]>(this.apiUrl);
  }

  getCustomer(id: number): Observable<Customer> {
    return this.http.get<Customer>(`${this.apiUrl}/${id}`);
  }

  createCustomer(customer: Customer): Observable<Customer> {
    return this.http.post<Customer>(this.apiUrl, customer);
  }

  updateCustomer(id: number, customer: Customer): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, customer);
  }

  deleteCustomer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Real Vehicle Operations
  getVehiclesByCustomer(customerId: number): Observable<Vehicle[]> {
    return this.http.get<Vehicle[]>(`${this.vehicleUrl}?customerId=${customerId}`);
  }

  createVehicle(vehicle: Vehicle): Observable<any> {
    return this.http.post<any>(this.vehicleUrl, vehicle);
  }

  updateVehicle(id: number, vehicle: Vehicle): Observable<any> {
    return this.http.put<any>(`${this.vehicleUrl}/${id}`, vehicle);
  }

  deleteVehicle(id: number): Observable<any> {
    return this.http.delete<any>(`${this.vehicleUrl}/${id}`);
  }
}
