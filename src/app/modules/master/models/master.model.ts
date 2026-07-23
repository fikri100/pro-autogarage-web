export interface Role {
  id?: number;
  roleName: string;
  permissions?: string; // JSONB stringified mapping
}

export interface Category {
  id?: number;
  name: string;
  itemTypeId?: number;
  itemTypeName?: string;
}

export interface Employee {
  id?: number;
  name: string;
  phone: string;
  address?: string;
  positionId?: number;
  position?: string;
}
