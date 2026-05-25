import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CashierService {
  private transactionUrl = '/api/transactions';

  constructor(private http: HttpClient) {}

  getReadyWorkOrders(): Observable<any[]> {
    return this.http.get<any[]>(`${this.transactionUrl}/ready-for-cashier`);
  }

  getTransactionByWO(woId: number): Observable<any> {
    return this.http.get<any>(`${this.transactionUrl}/wo/${woId}`);
  }

  payInvoice(transId: number, payload: any): Observable<void> {
    return this.http.post<void>(`${this.transactionUrl}/${transId}/pay`, payload);
  }
}
