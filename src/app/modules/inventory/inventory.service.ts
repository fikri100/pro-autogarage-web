import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product, StockLog } from './models/object';
import { PaginatedResponse } from '../../models/pagination.model';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private apiUrl = '/api/products';

  constructor(private http: HttpClient) {}

  getProducts(search?: string, type?: string, lowStock?: boolean, page: number = 1, limit: number = 10): Observable<PaginatedResponse<Product>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    if (search) {
      params = params.set('q', search);
    }
    if (type && type !== 'ALL') {
      params = params.set('type', type);
    }
    if (lowStock) {
      params = params.set('low_stock', 'true');
    }

    return this.http.get<PaginatedResponse<Product>>(this.apiUrl, { params });
  }

  getProduct(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }

  createProduct(product: Product): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, product);
  }

  updateProduct(id: number, product: Product): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, product);
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  restockProduct(payload: { productId: number; quantity: number; purchasePrice: number; referenceId: string; recordExpense: boolean }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/restock`, payload);
  }

  getProductStockLogs(id: number): Observable<StockLog[]> {
    return this.http.get<StockLog[]>(`${this.apiUrl}/${id}/stock-logs`);
  }
}

