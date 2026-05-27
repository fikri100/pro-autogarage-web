import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Role, Category, Employee } from './models/master.model';

@Injectable({
  providedIn: 'root'
})
export class MasterService {
  constructor(private http: HttpClient) {}

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
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>('/api/categories');
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
  getEmployees(): Observable<Employee[]> {
    return this.http.get<Employee[]>('/api/employees');
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
}
