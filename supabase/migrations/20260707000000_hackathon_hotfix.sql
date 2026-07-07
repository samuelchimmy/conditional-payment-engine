-- Create conditional_payments table
CREATE TABLE IF NOT EXISTS public.conditional_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  iou_id text,
  platform text,
  sender_id text,
  recipient_handle text,
  amount numeric,
  currency text,
  condition_str text,
  condition_meta jsonb,
  status text DEFAULT 'pending',
  tx_hash text,
  created_at timestamp with time zone DEFAULT now(),
  resolved_at timestamp with time zone
);

-- Create agent_transactions table
CREATE TABLE IF NOT EXISTS public.agent_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  message_id text NOT NULL,
  user_id text NOT NULL,
  intent_type text NOT NULL,
  amount numeric,
  recipient text,
  tx_hash text,
  error_reason text,
  replied boolean DEFAULT false,
  retry_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  replied_at timestamp with time zone
);

-- RLS Policies
ALTER TABLE public.conditional_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public view for conditional_payments"
  ON public.conditional_payments FOR SELECT
  USING ( true );

CREATE POLICY "Public view for agent_transactions"
  ON public.agent_transactions FOR SELECT
  USING ( true );

-- Allow inserts for hackathon demo
CREATE POLICY "Allow inserts conditional_payments"
  ON public.conditional_payments FOR INSERT
  WITH CHECK ( true );

