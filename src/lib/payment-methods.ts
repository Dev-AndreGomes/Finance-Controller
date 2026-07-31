import type { PaymentMethod } from '@/types';

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  PIX: 'Pix',
  CREDIT_CARD: 'Cartão de Crédito',
  DEBIT_CARD: 'Cartão de Débito',
  CASH: 'Dinheiro',
  BOLETO: 'Boleto',
  TRANSFER: 'Transferência',
};

export const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = (
  Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]
).map((value) => ({ value, label: PAYMENT_METHOD_LABELS[value] }));

// usado só pra decidir o status automático no preview do formulário — a
// regra de verdade (quem manda) é sempre calculada no servidor
export function paymentMethodStartsAsPaid(method: PaymentMethod | ''): boolean {
  return method !== 'CREDIT_CARD';
}
