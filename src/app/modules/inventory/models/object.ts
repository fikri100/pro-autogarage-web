export interface Product {
  id?: number;
  code: string;
  name: string;
  itemType: 'SPR' | 'SRV'; // SPR = Sparepart, SRV = Service/Jasa
  category?: string;
  purchasePrice?: number;
  salePrice: number;
  stockQuantity?: number;
  minStockLimit?: number;
  status?: string;
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface StockLog {
  id?: number;
  productId: number;
  logType: 'IN' | 'OUT';
  quantity: number;
  referenceId: string;
  status?: string;
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
}

