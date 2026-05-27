import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ReportFinanceSummary, ReportChartItem } from '../models/reports.model';

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private financeUrl = '/api/finance';
  private cashflowUrl = '/api/cashflows';

  constructor(private http: HttpClient) {}

  getFinanceSummary(): Observable<ReportFinanceSummary> {
    return this.http.get<ReportFinanceSummary>(`${this.financeUrl}/summary`);
  }

  getChartData(period: 'daily' | 'monthly' = 'daily'): Observable<ReportChartItem[]> {
    const params = new HttpParams().set('period', period);
    return this.http.get<ReportChartItem[]>(`${this.financeUrl}/chart`, { params });
  }

  getExpenses(startDate?: string, endDate?: string): Observable<any[]> {
    let params = new HttpParams().set('type', 'EXP');
    if (startDate) {
      params = params.set('startDate', startDate);
    }
    if (endDate) {
      params = params.set('endDate', endDate);
    }
    return this.http.get<any[]>(this.cashflowUrl, { params });
  }
}
