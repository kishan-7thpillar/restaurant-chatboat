-- Inventory Logs Table Schema
-- Tracks all inventory movements including inputs, outputs, and stock adjustments
-- Integrates with orders to automatically log ingredient usage

CREATE TABLE public.inventory_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  order_id uuid NULL,
  location_id uuid NULL,
  transaction_type text NOT NULL,
  transaction_reason text NULL,
  quantity_before numeric(10,2) NOT NULL,
  quantity_changed numeric(10,2) NOT NULL,
  quantity_after numeric(10,2) GENERATED ALWAYS AS (quantity_before + quantity_changed) STORED,
  unit_of_measure text NULL,
  cost_per_unit numeric(10,2) NULL,
  total_cost numeric(10,2) GENERATED ALWAYS AS (quantity_changed * COALESCE(cost_per_unit, 0)) STORED,
  reference_number text NULL,
  notes text NULL,
  performed_by uuid NULL,
  batch_number text NULL,
  expiry_date timestamp with time zone NULL,
  supplier_id text NULL,
  platform_data jsonb NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  
  -- Primary key
  CONSTRAINT inventory_logs_pkey PRIMARY KEY (id),
  
  -- Foreign key constraints
  CONSTRAINT fk_inventory_logs_product_id FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
  CONSTRAINT fk_inventory_logs_order_id FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE SET NULL,
  CONSTRAINT fk_inventory_logs_location_id FOREIGN KEY (location_id) REFERENCES locations (id) ON DELETE SET NULL,
  CONSTRAINT fk_inventory_logs_performed_by FOREIGN KEY (performed_by) REFERENCES users (id) ON DELETE SET NULL,
  
  -- Check constraints
  CONSTRAINT inventory_logs_transaction_type_check CHECK (
    transaction_type = ANY (ARRAY['input'::text, 'output'::text, 'adjustment'::text, 'waste'::text, 'transfer'::text])
  ),
  CONSTRAINT inventory_logs_transaction_reason_check CHECK (
    transaction_reason = ANY (ARRAY[
      'order_fulfillment'::text, 
      'stock_receipt'::text, 
      'manual_adjustment'::text, 
      'spoilage'::text, 
      'damage'::text, 
      'theft'::text, 
      'transfer_in'::text, 
      'transfer_out'::text, 
      'return'::text, 
      'promotion'::text,
      'inventory_count'::text
    ])
  )
) TABLESPACE pg_default;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_logs_product_id ON public.inventory_logs USING btree (product_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_inventory_logs_order_id ON public.inventory_logs USING btree (order_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_inventory_logs_location_id ON public.inventory_logs USING btree (location_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_inventory_logs_transaction_type ON public.inventory_logs USING btree (transaction_type) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_inventory_logs_transaction_reason ON public.inventory_logs USING btree (transaction_reason) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_inventory_logs_created_at ON public.inventory_logs USING btree (created_at) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_inventory_logs_performed_by ON public.inventory_logs USING btree (performed_by) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_inventory_logs_reference_number ON public.inventory_logs USING btree (reference_number) TABLESPACE pg_default;

-- Trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_inventory_logs_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_inventory_logs_updated_at 
    BEFORE UPDATE ON inventory_logs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_inventory_logs_updated_at_column();

-- Function to automatically create inventory logs when orders are created
CREATE OR REPLACE FUNCTION create_inventory_logs_for_order()
RETURNS TRIGGER AS $$
DECLARE
    ingredient_record RECORD;
    current_stock numeric(10,2);
BEGIN
    -- Only process if this is a new order (INSERT) or if order status changed to a fulfillment status
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.status IN ('preparing', 'ready', 'completed')) THEN
        
        -- Loop through all ingredients for products in this order
        FOR ingredient_record IN
            SELECT 
                pi.ingridiant_id as product_id,
                pi.quantity_required,
                pi.unit_of_measure,
                pi.cost_per_unit,
                p.name as product_name,
                -- Extract quantity from line_items JSONB (this is a simplified example)
                COALESCE((line_item->>'quantity')::numeric, 1) as order_quantity
            FROM product_ingredients pi
            JOIN products p ON pi.ingridiant_id = p.id
            CROSS JOIN LATERAL jsonb_array_elements(COALESCE(NEW.line_items, '[]'::jsonb)) as line_item
            WHERE pi.product_id::text = line_item->>'product_id'
              AND pi.is_active = true
        LOOP
            -- Get current stock from products table
            SELECT COALESCE(opening_stock, 0) INTO current_stock
            FROM products 
            WHERE id = ingredient_record.product_id;
            
            -- Calculate total quantity needed (ingredient quantity * order quantity)
            DECLARE
                total_quantity_needed numeric(10,2);
            BEGIN
                total_quantity_needed := ingredient_record.quantity_required * ingredient_record.order_quantity;
                
                -- Create inventory log entry
                INSERT INTO inventory_logs (
                    product_id,
                    order_id,
                    location_id,
                    transaction_type,
                    transaction_reason,
                    quantity_before,
                    quantity_changed,
                    unit_of_measure,
                    cost_per_unit,
                    reference_number,
                    notes,
                    performed_by
                ) VALUES (
                    ingredient_record.product_id,
                    NEW.id,
                    NEW.location_id,
                    'output',
                    'order_fulfillment',
                    current_stock,
                    -total_quantity_needed, -- Negative for output
                    ingredient_record.unit_of_measure,
                    ingredient_record.cost_per_unit,
                    NEW.platform_order_id,
                    'Automatic inventory deduction for order: ' || NEW.platform_order_id || ' - ' || ingredient_record.product_name,
                    NULL -- Could be set to the user who created the order if available
                );
                
                -- Update the product stock
                UPDATE products 
                SET opening_stock = current_stock - total_quantity_needed,
                    updated_at = now()
                WHERE id = ingredient_record.product_id;
            END;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically create inventory logs when orders are created/updated
CREATE TRIGGER trigger_create_inventory_logs_for_order
    AFTER INSERT OR UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION create_inventory_logs_for_order();

-- Comments for documentation
COMMENT ON TABLE inventory_logs IS 'Tracks all inventory movements including inputs, outputs, and stock adjustments';
COMMENT ON COLUMN inventory_logs.transaction_type IS 'Type of transaction: input, output, adjustment, waste, transfer';
COMMENT ON COLUMN inventory_logs.transaction_reason IS 'Specific reason: order_fulfillment, stock_receipt, manual_adjustment, etc.';
COMMENT ON COLUMN inventory_logs.quantity_changed IS 'Positive for inputs, negative for outputs';
COMMENT ON COLUMN inventory_logs.quantity_after IS 'Calculated field: quantity_before + quantity_changed';
COMMENT ON COLUMN inventory_logs.total_cost IS 'Calculated field: quantity_changed * cost_per_unit';
