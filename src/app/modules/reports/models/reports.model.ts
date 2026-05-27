export interface ReportFinanceSummary {
  totalIncome: number;
  totalExpense: number;
  netCashflow: number;
  grossProfit: number;
  totalServiceRevenue: number;
  totalSparepartSales: number;
  totalSparepartCOGS: number;
}

export interface ReportChartItem {
  label: string;
  income: number;
  expense: number;
}

export interface ExpenseCategoryBreakdown {
  category: string;
  label: string;
  amount: number;
  percentage: number;
  color: string;
  // Segment rendering values for SVG donut chart
  strokeDashArray?: string;
  strokeDashOffset?: number;
}
