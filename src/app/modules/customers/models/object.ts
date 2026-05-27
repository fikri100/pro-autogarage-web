export interface Customer {
  id?: number;
  name: string;
  phone: string;
  address?: string;
  email?: string;
  isSelfService?: boolean;
  status?: string;
  password?: string; // Only used for creation
}

export interface Vehicle {
  id?: number;
  customerId: number;
  licensePlate: string;
  brand?: string;
  model?: string;
  yearMade?: number;
  transmission?: string;
}

