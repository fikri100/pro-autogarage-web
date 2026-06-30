import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cashflow, FinanceSummary, FinanceChartItem } from '../models/finance.model';
import { PaginatedResponse } from '../../../models/pagination.model';

@Injectable({
  providedIn: 'root'
})
export class FinanceService {
  private cashflowUrl = '/api/cashflows';
  private financeUrl = '/api/finance';

  constructor(private http: HttpClient) {}

  getCashflows(filters: { type?: string; category?: string; startDate?: string; endDate?: string; search?: string; page?: number; limit?: number } = {}): Observable<PaginatedResponse<Cashflow>> {
    let params = new HttpParams();
    if (filters.type) {
      params = params.set('type', filters.type);
    }
    if (filters.category) {
      params = params.set('category', filters.category);
    }
    if (filters.startDate) {
      params = params.set('startDate', filters.startDate);
    }
    if (filters.endDate) {
      params = params.set('endDate', filters.endDate);
    }
    if (filters.search) {
      params = params.set('search', filters.search);
    }
    if (filters.page) {
      params = params.set('page', filters.page.toString());
    }
    if (filters.limit) {
      params = params.set('limit', filters.limit.toString());
    }
    return this.http.get<PaginatedResponse<Cashflow>>(this.cashflowUrl, { params });
  }

  createCashflow(payload: Cashflow): Observable<Cashflow> {
    return this.http.post<Cashflow>(this.cashflowUrl, payload);
  }

  deleteCashflow(id: number): Observable<void> {
    return this.http.delete<void>(`${this.cashflowUrl}/${id}`);
  }

  getFinanceSummary(): Observable<FinanceSummary> {
    return this.http.get<FinanceSummary>(`${this.financeUrl}/summary`);
  }

  getChartData(period: 'daily' | 'monthly' = 'daily'): Observable<FinanceChartItem[]> {
    let params = new HttpParams().set('period', period);
    return this.http.get<FinanceChartItem[]>(`${this.financeUrl}/chart`, { params });
  }

  getParamsByGroup(group: string): Observable<any[]> {
    return this.http.get<any[]>(`/api/params?group_param=${group}`);
  }
}
