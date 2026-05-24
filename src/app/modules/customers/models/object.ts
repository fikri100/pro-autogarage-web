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
