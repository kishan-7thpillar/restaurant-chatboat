-- Create unified inventory table for restaurant POS systems
CREATE TABLE IF NOT EXISTS inventory (
    -- Primary key
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Platform identification
    platform text NOT NULL CHECK (platform IN ('toast', 'square', 'clover')),
    
    -- Platform-specific inventory IDs
    platform_inventory_id text NOT NULL,
    
    -- Product reference (foreign key to products table)
    product_id uuid REFERENCES products(id),
    platform_product_id text,
    
    -- Basic inventory information
    name text,
    alternate_name text,
    sku text,
    code text,
    
    -- Inventory levels
    stock_count numeric(10,2),
    quantity numeric(10,2),
    reorder_threshold numeric(10,2),
    reorder_quantity numeric(10,2),
    
    -- Unit information
    unit_name text,
    unit_type text,
    
    -- Status information
    is_available boolean DEFAULT true,
    is_hidden boolean DEFAULT false,
    is_deleted boolean DEFAULT false,
    auto_manage boolean DEFAULT false,
    
    -- Cost information
    cost numeric(10,2),
    price numeric(10,2),
    price_without_vat numeric(10,2),
    price_type text,
    
    -- Location information
    location_id text,
    storage_location text,
    
    -- Group information
    item_group_id text,
    category_id text,
    
    -- Additional information
    color_code text,
    
    -- Related data stored as JSONB for flexibility
    options jsonb,
    tax_rates jsonb,
    tags jsonb,
    categories jsonb,
    modifiers jsonb,
    modifier_groups jsonb,
    
    -- Additional platform-specific data
    platform_data jsonb,
    
    -- Timestamps
    modified_time timestamptz,
    deleted_time timestamptz,
    
    -- Audit fields
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    -- Constraints
    UNIQUE(platform, platform_inventory_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_inventory_platform ON inventory(platform);
CREATE INDEX IF NOT EXISTS idx_inventory_platform_inventory_id ON inventory(platform_inventory_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_platform_product_id ON inventory(platform_product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_sku ON inventory(sku);
CREATE INDEX IF NOT EXISTS idx_inventory_is_available ON inventory(is_available);
CREATE INDEX IF NOT EXISTS idx_inventory_is_deleted ON inventory(is_deleted);
CREATE INDEX IF NOT EXISTS idx_inventory_location_id ON inventory(location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_modified_time ON inventory(modified_time);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_inventory_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_inventory_updated_at 
    BEFORE UPDATE ON inventory 
    FOR EACH ROW 
    EXECUTE FUNCTION update_inventory_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE inventory IS 'Unified inventory table for restaurant POS systems';
COMMENT ON COLUMN inventory.platform IS 'Source system: toast, square, or clover';
COMMENT ON COLUMN inventory.platform_inventory_id IS 'Original inventory ID from the source platform';
COMMENT ON COLUMN inventory.product_id IS 'Foreign key reference to the products table';
COMMENT ON COLUMN inventory.platform_product_id IS 'Original product ID from the source platform';
COMMENT ON COLUMN inventory.options IS 'Inventory options stored as JSONB for flexibility across platforms';
COMMENT ON COLUMN inventory.tax_rates IS 'Tax rates stored as JSONB';
COMMENT ON COLUMN inventory.platform_data IS 'Additional platform-specific data that doesn''t fit standard schema';
