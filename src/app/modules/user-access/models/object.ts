export interface User {
  id?: number;
  username: string;
  roleId: number;
  roleName?: string;
  employeeId: number;
  employeeName?: string;
  status?: string;
  password?: string;
  menus?: any[];
}

export interface Role {
  id: number;
  roleName: string;
  permissions: string; // JSON string
}

export interface Employee {
  id: number;
  name: string;
  position: string;
}
