import { Product } from './object';

export interface ProductRequest {
  code: string;
  name: string;
  itemType: 'SPR' | 'SRV';
  category?: string;
  purchasePrice?: number;
  salePrice: number;
  stockQuantity?: number;
  minStockLimit?: number;
}
