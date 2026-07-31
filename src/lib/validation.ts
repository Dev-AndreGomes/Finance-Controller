import { z } from 'zod';

const paymentMethodEnum = z.enum(['PIX', 'CREDIT_CARD', 'DEBIT_CARD', 'CASH', 'BOLETO', 'TRANSFER']);

export const createTransactionSchema = z.object({
  description: z.string().trim().min(1, 'Descrição é obrigatória').max(120),
  amount: z.number().positive('O valor deve ser positivo'),
  type: z.enum(['INCOME', 'EXPENSE']),
  subtype: z.enum(['FIXED', 'VARIABLE']).optional(),
  date: z.string().datetime({ offset: true }).or(z.string().min(1)),
  categoryId: z.string().min(1).optional().nullable(),
  // Parcelamento — só faz sentido pra despesa variável. `amount` aqui é o
  // valor TOTAL da compra, dividido entre installmentTotal parcelas.
  isInstallment: z.boolean().optional(),
  installmentTotal: z.number().int().min(2).max(60).optional(),
  // Forma de pagamento — só relevante pra despesa. isPaid é calculado no
  // servidor a partir do método (cartão de crédito nasce pendente), então
  // não aceita isPaid vindo do cliente na criação.
  paymentMethod: paymentMethodEnum.optional(),
});

export const updateTransactionSchema = createTransactionSchema.partial().extend({
  // isPaid só pode ser mudado depois, via edição — é o botão "marcar como pago"
  isPaid: z.boolean().optional(),
});

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório').max(60),
  kind: z.enum(['INCOME', 'EXPENSE']),
  color: z.string().trim().min(1).max(20).optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const createFixedTemplateSchema = z.object({
  description: z.string().trim().min(1, 'Descrição é obrigatória').max(120),
  amount: z.number().positive('O valor deve ser positivo'),
  dayOfMonth: z.number().int().min(1).max(31),
  startMonth: z.number().int().min(1).max(12),
  startYear: z.number().int().min(2000).max(2100),
  repeats: z.boolean(),
  endMonth: z.number().int().min(1).max(12).nullable().optional(),
  endYear: z.number().int().min(2000).max(2100).nullable().optional(),
  paymentMethod: paymentMethodEnum.optional(),
});

export const updateFixedTemplateSchema = z.object({
  description: z.string().trim().min(1).max(120).optional(),
  amount: z.number().positive().optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  endMonth: z.number().int().min(1).max(12).nullable().optional(),
  endYear: z.number().int().min(2000).max(2100).nullable().optional(),
  paymentMethod: paymentMethodEnum.optional(),
});

export const upsertPlanSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  investPercentage: z.number().min(0).max(100),
  confirmed: z.boolean().optional(),
});
