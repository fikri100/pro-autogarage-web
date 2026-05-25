import { Product } from './object';

export interface ProductResponse {
  success: boolean;
  data: Product;
  message?: string;
}
