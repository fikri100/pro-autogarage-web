export interface CreateCustomerRequest {
  name: string;
  phone: string;
  address?: string;
  email?: string;
  isSelfService?: boolean;
}
