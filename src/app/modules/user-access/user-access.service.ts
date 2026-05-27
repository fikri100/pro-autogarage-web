import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, Role, Employee } from './models/object';

@Injectable({
  providedIn: 'root'
})
export class UserAccessService {
  constructor(private http: HttpClient) {}

  // Users
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>('/api/users');
  }

  createUser(user: User): Observable<void> {
    return this.http.post<void>('/api/users', user);
  }

  updateUser(id: number, user: User): Observable<void> {
    return this.http.put<void>(`/api/users/${id}`, user);
  }

  // Roles
  getRoles(): Observable<Role[]> {
    return this.http.get<Role[]>('/api/roles');
  }



  // Employees
  getEmployees(): Observable<Employee[]> {
    return this.http.get<Employee[]>('/api/employees');
  }

  // Menus
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
