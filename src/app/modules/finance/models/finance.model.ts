export interface Cashflow {
  id?: number;
  cashflowType: 'INC' | 'EXP';
  amount: number;
  category: string;
  description?: string;
  transactionId?: number;
  flowDate: string; // YYYY-MM-DD
  status?: string;
  createdBy?: string;
  createdAt?: string;
}

export interface FinanceSummary {
  totalIncome: number;
  totalExpense: number;
  netCashflow: number;
  grossProfit: number;
  totalServiceRevenue: number;
  totalSparepartSales: number;
  totalSparepartCOGS: number;
}

export interface FinanceChartItem {
  label: string;
  income: number;
  expense: number;
}
