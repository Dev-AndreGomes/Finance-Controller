import { Transaction } from '@/types';
import { PAYMENT_METHOD_LABELS } from './payment-methods';

// escapa aspas/vírgula/quebra de linha do jeito que CSV espera
function csvCell(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

const TYPE_LABELS: Record<string, string> = {
  INCOME: 'Receita',
  FIXED: 'Despesa fixa',
  VARIABLE: 'Despesa variável',
};

export function transactionsToCsv(transactions: Transaction[]): string {
  const header = ['Data', 'Descrição', 'Tipo', 'Categoria', 'Valor', 'Forma de pagamento', 'Status', 'Parcela'];

  const rows = transactions.map((t) => {
    const tipo = t.type === 'INCOME' ? TYPE_LABELS.INCOME : t.subtype === 'FIXED' ? TYPE_LABELS.FIXED : TYPE_LABELS.VARIABLE;
    return [
      new Date(t.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
      t.description,
      tipo,
      t.category?.name ?? '',
      parseFloat(t.amount).toFixed(2).replace('.', ','),
      t.paymentMethod ? PAYMENT_METHOD_LABELS[t.paymentMethod] : '',
      t.type === 'EXPENSE' ? (t.isPaid ? 'Pago' : 'Pendente') : '',
      t.installmentTotal ? `${t.installmentNumber}/${t.installmentTotal}` : '',
    ].map(csvCell);
  });

  // ponto e vírgula como separador — é o que o Excel em português espera por
  // padrão (vírgula já é usada como separador decimal aqui)
  return [header, ...rows].map((row) => row.join(';')).join('\r\n');
}

export function downloadCsv(filename: string, csvContent: string) {
  // BOM no início — sem isso o Excel no Windows abre acento errado (não
  // reconhece UTF-8 sozinho)
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
