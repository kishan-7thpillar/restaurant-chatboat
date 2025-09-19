-- Create unified orders table for Toast, Square, and Clover POS systems
CREATE TABLE IF NOT EXISTS orders (
    -- Primary key
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Platform identification
    platform text NOT NULL CHECK (platform IN ('toast', 'square', 'clover')),
    
    -- Platform-specific order IDs
    platform_order_id text NOT NULL,
    external_id text,
    
    -- Order status and state
    status text,
    state text,
    payment_status text,
    
    -- Timestamps
    created_date timestamptz,
    modified_date timestamptz,
    opened_date timestamptz,
    closed_date timestamptz,
    paid_date timestamptz,
    promised_date timestamptz,
    estimated_fulfillment_date timestamptz,
    
    -- Financial information
    currency text DEFAULT 'USD',
    subtotal_amount numeric(10,2),
    tax_amount numeric(10,2),
    tip_amount numeric(10,2),
    discount_amount numeric(10,2),
    service_charge_amount numeric(10,2),
    total_amount numeric(10,2) NOT NULL,
    
    -- Customer information
    customer_id text,
    customer_first_name text,
    customer_last_name text,
    customer_email text,
    customer_phone text,
    
    -- Order details
    order_type text,
    dining_option text,
    source text,
    number_of_guests integer,
    display_number text,
    tab_name text,
    
    -- Location and service information
    location_id text,
    table_id text,
    service_area_id text,
    revenue_center_id text,
    channel_id text,
    
    -- Delivery information
    delivery_address jsonb,
    delivery_notes text,
    delivery_state text,
    delivered_date timestamptz,
    dispatched_date timestamptz,
    
    -- Order items and details (stored as JSONB for flexibility)
    line_items jsonb,
    payments jsonb,
    discounts jsonb,
    taxes jsonb,
    service_charges jsonb,
    
    -- Additional platform-specific data
    platform_data jsonb,
    
    -- Flags
    is_voided boolean DEFAULT false,
    is_deleted boolean DEFAULT false,
    is_test_mode boolean DEFAULT false,
    is_tax_exempt boolean DEFAULT false,
    
    -- Audit fields
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    -- Constraints
    UNIQUE(platform, platform_order_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_platform ON orders(platform);
CREATE INDEX IF NOT EXISTS idx_orders_platform_order_id ON orders(platform_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_date ON orders(created_date);
CREATE INDEX IF NOT EXISTS idx_orders_total_amount ON orders(total_amount);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_location_id ON orders(location_id);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE orders IS 'Unified orders table for Toast, Square, and Clover POS systems';
COMMENT ON COLUMN orders.platform IS 'Source POS system: toast, square, or clover';
COMMENT ON COLUMN orders.platform_order_id IS 'Original order ID from the source platform';
COMMENT ON COLUMN orders.line_items IS 'Order items stored as JSONB for flexibility across platforms';
COMMENT ON COLUMN orders.payments IS 'Payment information stored as JSONB';
COMMENT ON COLUMN orders.platform_data IS 'Additional platform-specific data that doesn''t fit standard schema';
