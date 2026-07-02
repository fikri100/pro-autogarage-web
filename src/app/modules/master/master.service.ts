import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Role, Category, Employee } from './models/master.model';
import { PaginatedResponse } from '../../models/pagination.model';

@Injectable({
  providedIn: 'root'
})
export class MasterService {
  constructor(private http: HttpClient) {}

  // Parameter Operations
  getParamsByGroup(group: string): Observable<any[]> {
    return this.http.get<any[]>(`/api/params?group_param=${group}`);
  }

  // Role CRUD Operations
  getRoles(): Observable<Role[]> {
    return this.http.get<Role[]>('/api/roles');
  }

  createRole(role: Role): Observable<Role> {
    return this.http.post<Role>('/api/roles', role);
  }

  updateRole(id: number, role: Role): Observable<any> {
    return this.http.put<any>(`/api/roles/${id}`, role);
  }

  deleteRole(id: number): Observable<any> {
    return this.http.delete<any>(`/api/roles/${id}`);
  }

  // Category CRUD Operations
  getCategories(itemTypeId?: number): Observable<Category[]> {
    let params = new HttpParams();
    if (itemTypeId) {
      params = params.set('item_type_id', itemTypeId.toString());
    }
    return this.http.get<Category[]>('/api/categories', { params });
  }

  createCategory(category: Category): Observable<Category> {
    return this.http.post<Category>('/api/categories', category);
  }

  updateCategory(id: number, category: Category): Observable<any> {
    return this.http.put<any>(`/api/categories/${id}`, category);
  }

  deleteCategory(id: number): Observable<any> {
    return this.http.delete<any>(`/api/categories/${id}`);
  }

  // Employee CRUD Operations
  getEmployees(search: string = '', page: number = 1, limit: number = 10): Observable<PaginatedResponse<Employee>> {
    const params = new HttpParams()
      .set('search', search)
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.http.get<PaginatedResponse<Employee>>('/api/employees', { params });
  }

  createEmployee(employee: Employee): Observable<any> {
    return this.http.post<any>('/api/employees', employee);
  }

  updateEmployee(id: number, employee: Employee): Observable<any> {
    return this.http.put<any>(`/api/employees/${id}`, employee);
  }

  deleteEmployee(id: number): Observable<any> {
    return this.http.delete<any>(`/api/employees/${id}`);
  }

  // Menu Operations
  getSystemMenus(): Observable<any[]> {
    return this.http.get<any[]>('/api/menus');
  }

  getRoleMenus(roleId: number): Observable<number[]> {
    return this.http.get<number[]>(`/api/roles/${roleId}/menus`);
  }

  updateRoleMenus(roleId: number, menuIds: number[]): Observable<any> {
    return this.http.put<any>(`/api/roles/${roleId}/menus`, { menuIds });
  }
}
