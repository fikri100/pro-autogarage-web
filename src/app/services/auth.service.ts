import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { User } from '../modules/user-access/models/object';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly SESSION_KEY = 'pro_auto_garage_session';

  // Reactive menus stream — used by App component to avoid getter-induced infinite CD loop
  private menusSubject = new BehaviorSubject<any[]>(this._loadMenusFromSession());
  readonly menus$ = this.menusSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  login(username: string, password: string): Observable<User> {
    return this.http.post<User>('/api/login', { username, password }).pipe(
      tap((user: User) => {
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(user));
        // Push fresh menus into stream immediately after login
        this.menusSubject.next(user.menus || []);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.SESSION_KEY);
    this.menusSubject.next([]);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem(this.SESSION_KEY);
  }

  get currentUser(): User | null {
    const session = localStorage.getItem(this.SESSION_KEY);
    if (!session) return null;
    try {
      return JSON.parse(session) as User;
    } catch {
      localStorage.removeItem(this.SESSION_KEY);
      return null;
    }
  }

  /** Call this after updating menus in localStorage to keep sidebar reactive */
  updateMenus(menus: any[]): void {
    this.menusSubject.next(menus);
  }

  private _loadMenusFromSession(): any[] {
    try {
      const session = localStorage.getItem(this.SESSION_KEY);
      if (!session) return [];
      const user = JSON.parse(session) as User;
      return user.menus || [];
    } catch {
      return [];
    }
  }
}
