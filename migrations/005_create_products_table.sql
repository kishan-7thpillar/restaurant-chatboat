-- Create unified products table for Toast, Square, and Clover systems
CREATE TABLE IF NOT EXISTS products (
    -- Primary key
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Platform identification
    platform text NOT NULL CHECK (platform IN ('toast', 'square', 'clover')),
    
    -- Platform-specific product IDs
    platform_product_id text NOT NULL,
    external_id text,
    
    -- Basic product information
    name text NOT NULL,
    description text,
    kitchen_name text,
    alternate_name text,
    
    -- Pricing information
    price numeric(10,2),
    cost numeric(10,2),
    price_type text,
    pricing_strategy text,
    price_without_vat numeric(10,2),
    
    -- Product identifiers
    sku text,
    plu text,
    code text,
    upc text,
    
    -- Categorization
    category_id text,
    category_name text,
    item_group_id text,
    
    -- Product status
    is_available boolean DEFAULT true,
    is_hidden boolean DEFAULT false,
    is_deleted boolean DEFAULT false,
    is_revenue boolean DEFAULT true,
    is_discountable boolean DEFAULT true,
    
    -- Inventory information
    stock_count integer,
    auto_manage_stock boolean DEFAULT false,
    unit_name text,
    unit_of_measure text,
    
    -- Physical attributes
    calories integer,
    weight numeric(10,2),
    weight_unit_of_measure text,
    length numeric(10,2),
    width numeric(10,2),
    height numeric(10,2),
    dimension_unit_of_measure text,
    
    -- Display information
    image_url text,
    color_code text,
    pos_name text,
    pos_button_color_light text,
    pos_button_color_dark text,
    sort_order integer,
    
    -- Tax information
    default_tax_rates boolean DEFAULT true,
    tax_inclusion text,
    
    -- Preparation information
    prep_time integer,
    prep_stations jsonb,
    
    -- Related data stored as JSONB for flexibility
    variations jsonb,
    modifiers jsonb,
    modifier_groups jsonb,
    options jsonb,
    categories jsonb,
    tags jsonb,
    tax_rates jsonb,
    images jsonb,
    allergens jsonb,
    content_advisories jsonb,
    
    -- Additional platform-specific data
    platform_data jsonb,
    
    -- Timestamps
    created_date timestamptz,
    modified_date timestamptz,
    deleted_date timestamptz,
    
    -- Audit fields
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    -- Constraints
    UNIQUE(platform, platform_product_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_products_platform ON products(platform);
CREATE INDEX IF NOT EXISTS idx_products_platform_product_id ON products(platform_product_id);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_available ON products(is_available);
CREATE INDEX IF NOT EXISTS idx_products_is_deleted ON products(is_deleted);
CREATE INDEX IF NOT EXISTS idx_products_modified_date ON products(modified_date);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_products_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products 
    FOR EACH ROW 
    EXECUTE FUNCTION update_products_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE products IS 'Unified products table for Toast, Square, and Clover systems';
COMMENT ON COLUMN products.platform IS 'Source system: toast, square, or clover';
COMMENT ON COLUMN products.platform_product_id IS 'Original product ID from the source platform';
COMMENT ON COLUMN products.variations IS 'Product variations stored as JSONB for flexibility across platforms';
COMMENT ON COLUMN products.modifiers IS 'Product modifiers stored as JSONB';
COMMENT ON COLUMN products.modifier_groups IS 'Product modifier groups stored as JSONB';
COMMENT ON COLUMN products.categories IS 'Product categories stored as JSONB';
COMMENT ON COLUMN products.tax_rates IS 'Product tax rates stored as JSONB';
COMMENT ON COLUMN products.platform_data IS 'Additional platform-specific data that doesn''t fit standard schema';
