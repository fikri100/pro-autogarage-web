import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { WorkOrder } from './models/object';
import { PaginatedResponse } from '../../models/pagination.model';

@Injectable({
  providedIn: 'root'
})
export class WorkOrderService {
  private woUrl = '/api/work-orders';
  private employeesUrl = '/api/employees';
  private productsUrl = '/api/products';
  private transactionUrl = '/api/transactions';

  constructor(private http: HttpClient) {}

  getWorkOrders(search: string = '', page: number = 1, limit: number = 10): Observable<PaginatedResponse<WorkOrder>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('search', search);

    return this.http.get<PaginatedResponse<WorkOrder>>(this.woUrl, { params });
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

  updateEstimation(id: number, estimatedMinutes: number): Observable<void> {
    return this.http.put<void>(`${this.woUrl}/${id}/estimation`, { estimatedMinutes });
  }

  completeWorkOrder(id: number): Observable<void> {
    return this.http.put<void>(`${this.woUrl}/${id}/complete`, {});
  }

  getMechanics(): Observable<any[]> {
    return this.http.get<any[]>(this.employeesUrl);
  }

  getProducts(search?: string): Observable<any[]> {
    let params: any = { limit: '10000' };
    if (search) {
      params.q = search;
    }
    return this.http.get<any[]>(this.productsUrl, { params });
  }
}
