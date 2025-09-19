-- Migration: Create payments table and migrate data from orders.payments JSONB
-- This creates a normalized payments table linked to orders

-- Step 1: Create the payments table
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  platform text NOT NULL,
  platform_payment_id text NULL,
  external_id text NULL,
  payment_method text NULL,
  payment_type text NULL,
  status text NULL,
  amount numeric(10,2) NOT NULL,
  currency text NULL DEFAULT 'USD'::text,
  tip_amount numeric(10,2) NULL DEFAULT 0,
  processing_fee numeric(10,2) NULL DEFAULT 0,
  refunded_amount numeric(10,2) NULL DEFAULT 0,
  authorized_amount numeric(10,2) NULL,
  captured_amount numeric(10,2) NULL,
  card_brand text NULL,
  card_last_four text NULL,
  card_exp_month integer NULL,
  card_exp_year integer NULL,
  processor text NULL,
  processor_transaction_id text NULL,
  authorization_code text NULL,
  gateway_response text NULL,
  processed_at timestamp with time zone NULL,
  authorized_at timestamp with time zone NULL,
  captured_at timestamp with time zone NULL,
  refunded_at timestamp with time zone NULL,
  voided_at timestamp with time zone NULL,
  is_voided boolean NULL DEFAULT false,
  is_refunded boolean NULL DEFAULT false,
  is_test_mode boolean NULL DEFAULT false,
  notes text NULL,
  platform_data jsonb NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT fk_payments_order_id FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
  CONSTRAINT payments_platform_check CHECK (
    platform = ANY (ARRAY['toast'::text, 'square'::text, 'clover'::text])
  ),
  CONSTRAINT payments_amount_positive CHECK (amount >= 0),
  CONSTRAINT payments_currency_valid CHECK (currency IN ('USD', 'CAD', 'EUR', 'GBP'))
);

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments USING btree (order_id);
CREATE INDEX IF NOT EXISTS idx_payments_platform ON public.payments USING btree (platform);
CREATE INDEX IF NOT EXISTS idx_payments_payment_method ON public.payments USING btree (payment_method);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments USING btree (status);
CREATE INDEX IF NOT EXISTS idx_payments_processed_at ON public.payments USING btree (processed_at);
CREATE INDEX IF NOT EXISTS idx_payments_amount ON public.payments USING btree (amount);
CREATE INDEX IF NOT EXISTS idx_payments_platform_payment_id ON public.payments USING btree (platform_payment_id);

-- Step 3: Create trigger for updated_at
CREATE TRIGGER update_payments_updated_at 
  BEFORE UPDATE ON payments 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Step 4: Migrate existing payment data from orders.payments JSONB to payments table
-- This assumes the payments JSONB structure is an array of payment objects
INSERT INTO public.payments (
  order_id,
  platform,
  payment_method,
  amount,
  currency,
  tip_amount,
  processing_fee,
  status,
  processor,
  processor_transaction_id,
  card_brand,
  card_last_four,
  processed_at,
  platform_data,
  created_at,
  updated_at
)
SELECT 
  o.id as order_id,
  o.platform,
  COALESCE(payment_item->>'method', payment_item->>'type') as payment_method,
  COALESCE(
    (payment_item->>'amount')::numeric(10,2),
    (payment_item->>'total')::numeric(10,2),
    0
  ) as amount,
  COALESCE(payment_item->>'currency', o.currency, 'USD') as currency,
  COALESCE((payment_item->>'tip_amount')::numeric(10,2), 0) as tip_amount,
  COALESCE((payment_item->>'processing_fee')::numeric(10,2), 0) as processing_fee,
  COALESCE(payment_item->>'status', 'completed') as status,
  payment_item->>'processor' as processor,
  payment_item->>'transaction_id' as processor_transaction_id,
  payment_item->>'card_brand' as card_brand,
  payment_item->>'last_four' as card_last_four,
  CASE 
    WHEN payment_item->>'processed_at' IS NOT NULL 
    THEN (payment_item->>'processed_at')::timestamp with time zone
    ELSE o.paid_date
  END as processed_at,
  payment_item as platform_data,
  o.created_at,
  o.updated_at
FROM orders o
CROSS JOIN LATERAL jsonb_array_elements(
  CASE 
    WHEN jsonb_typeof(o.payments) = 'array' THEN o.payments
    WHEN o.payments IS NOT NULL THEN jsonb_build_array(o.payments)
    ELSE '[]'::jsonb
  END
) AS payment_item
WHERE o.payments IS NOT NULL 
  AND o.payments != 'null'::jsonb 
  AND o.payments != '[]'::jsonb;

-- Step 5: Add comment to document the migration
COMMENT ON TABLE public.payments IS 'Normalized payments table extracted from orders.payments JSONB field. Contains individual payment records linked to orders.';

-- Step 6: Optional - Remove payments column from orders table after verification
-- Uncomment the following line after verifying the migration was successful:
ALTER TABLE public.orders DROP COLUMN payments;

-- Step 7: Grant necessary permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO your_app_role;
-- GRANT USAGE ON SEQUENCE payments_id_seq TO your_app_role;
