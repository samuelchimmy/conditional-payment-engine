import { z } from 'zod';

export const IntentSchema = z.object({
  intentType: z.enum([
    'conditional_payment', 'simple_payment', 'claim',
    'balance', 'unknown', 'injection_attempt'
  ]),
  // M1: Enforce $10,000 maximum amount cap at schema level
  amount: z.number().positive().max(10_000, 'Amount exceeds $10,000 cap').nullable().optional(),
  currency: z.enum(['USDT', 'USDC']).default('USDT').nullable().optional(),
  recipient: z.string().regex(/^@[a-zA-Z0-9_]{1,50}$/).nullable().optional(),
  condition: z.object({
    type: z.string(),
    rawText: z.string().max(500),
    params: z.record(z.unknown()),
  }).nullable().optional(),
  confidence: z.number().min(0).max(1),
  language: z.string().max(10).optional(),
  refusalReason: z.string().nullable().optional(),
  _rejected: z.string().optional(), // AI self-flagging field
});
