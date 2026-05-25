import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { WorkOrder } from './models/object';

@Injectable({
  providedIn: 'root'
})
export class WorkOrderService {
  private woUrl = '/api/work-orders';
  private employeesUrl = '/api/employees';
  private productsUrl = '/api/products';
  private transactionUrl = '/api/transactions';

  constructor(private http: HttpClient) {}

  getWorkOrders(): Observable<WorkOrder[]> {
    return this.http.get<WorkOrder[]>(this.woUrl);
  }

  getWorkOrder(id: number): Observable<WorkOrder> {
    return this.http.get<WorkOrder>(`${this.woUrl}/${id}`);
  }

  assignMechanic(id: number, mechanicId: number, notes: string): Observable<void> {
    return this.http.put<void>(`${this.woUrl}/${id}/assign`, { mechanicId, notes });
  }

  getEstimation(woId: number): Observable<any> {
    return this.http.get<any>(`${this.transactionUrl}/wo/${woId}`);
  }

  saveEstimation(id: number, details: any[]): Observable<void> {
    return this.http.put<void>(`${this.woUrl}/${id}/estimate`, details);
  }

  completeWorkOrder(id: number): Observable<void> {
    return this.http.put<void>(`${this.woUrl}/${id}/complete`, {});
  }

  getMechanics(): Observable<any[]> {
    return this.http.get<any[]>(this.employeesUrl);
  }

  getProducts(search?: string): Observable<any[]> {
    return this.http.get<any[]>(this.productsUrl, {
      params: search ? { q: search } : {}
    });
  }
}
