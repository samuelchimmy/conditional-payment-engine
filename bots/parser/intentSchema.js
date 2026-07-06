import { z } from 'zod';

export const IntentSchema = z.object({
  intentType: z.enum([
    'conditional_payment', 'simple_payment', 'claim',
    'balance', 'unknown', 'injection_attempt'
  ]),
  amount: z.number().positive().nullable(),
  currency: z.enum(['USDT', 'USDC']).default('USDT').nullable(),
  recipient: z.string().regex(/^@[a-zA-Z0-9_]{1,50}$/).nullable(),
  condition: z.object({
    type: z.string(),
    rawText: z.string().max(500),
    params: z.record(z.unknown()),
  }).nullable(),
  confidence: z.number().min(0).max(1),
  language: z.string().max(10),
  refusalReason: z.string().nullable(),
});
