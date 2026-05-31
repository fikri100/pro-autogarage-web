import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PaginatedResponse } from '../../models/pagination.model';

@Injectable({
  providedIn: 'root'
})
export class CashierService {
  private transactionUrl = '/api/transactions';

  constructor(private http: HttpClient) {}

  getReadyWorkOrders(search: string = '', page: number = 1, limit: number = 10): Observable<PaginatedResponse<any>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('search', search);

    return this.http.get<PaginatedResponse<any>>(`${this.transactionUrl}/ready-for-cashier`, { params });
  }

  getTransactionByWO(woId: number): Observable<any> {
    return this.http.get<any>(`${this.transactionUrl}/wo/${woId}`);
  }

  payInvoice(transId: number, payload: any): Observable<void> {
    return this.http.post<void>(`${this.transactionUrl}/${transId}/pay`, payload);
  }
}
