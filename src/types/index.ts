export type TransactionType = 'INCOME' | 'EXPENSE';
export type ExpenseSubtype = 'FIXED' | 'VARIABLE';
export type PaymentMethod = 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'CASH' | 'BOLETO' | 'TRANSFER';

export interface Category {
  id: string;
  name: string;
  kind: TransactionType;
  color: string | null;
}

export interface Transaction {
  id: string;
  description: string;
  amount: string;
  type: TransactionType;
  subtype: ExpenseSubtype | null;
  date: string;
  categoryId: string | null;
  category?: Category | null;
  templateId: string | null;
  installmentGroupId: string | null;
  installmentNumber: number | null;
  installmentTotal: number | null;
  paymentMethod: PaymentMethod | null;
  isPaid: boolean;
}

export interface FixedExpenseTemplate {
  id: string;
  description: string;
  amount: string;
  dayOfMonth: number;
  startMonth: number;
  startYear: number;
  endMonth: number | null;
  endYear: number | null;
  paymentMethod: PaymentMethod | null;
}

export interface MonthlyPlan {
  month: number;
  year: number;
  investPercentage: number;
  confirmed: boolean;
}

export interface MonthHistory {
  month: number;
  year: number;
  totalIncome: number;
  totalExpenses: number;
  invested: number;
  investConfirmed: boolean;
  balance: number;
}
