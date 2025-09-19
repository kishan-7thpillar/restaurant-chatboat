-- Migration: Create unified customers table
-- This table consolidates customer data from Toast, Square, and Clover POS systems

CREATE TYPE platform_type AS ENUM ('toast', 'square', 'clover');

CREATE TABLE customers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    platform platform_type NOT NULL,
    platform_customer_id text NOT NULL,
    external_id text,
    reference_id text,
    
    -- Basic customer information
    first_name text,
    last_name text,
    given_name text,
    family_name text,
    email_address text,
    phone_number text,
    
    -- Address information
    address_line_1 text,
    address_line_2 text,
    address_line_3 text,
    locality text,
    city text,
    administrative_district_level_1 text,
    state text,
    postal_code text,
    zip text,
    country text,
    
    -- Customer preferences and metadata
    note text,
    business_name text,
    marketing_allowed boolean DEFAULT false,
    email_unsubscribed boolean DEFAULT false,
    
    -- Date of birth
    dob_year integer,
    dob_month integer,
    dob_day integer,
    
    -- Customer lifecycle
    customer_since bigint,
    creation_source text,
    version integer DEFAULT 1,
    
    -- Location reference
    location_id uuid REFERENCES locations(id),
    
    -- Complex data stored as JSONB
    preferences jsonb,
    addresses jsonb,
    email_addresses jsonb,
    phone_numbers jsonb,
    cards jsonb,
    group_ids jsonb,
    segment_ids jsonb,
    orders jsonb,
    metadata jsonb,
    platform_data jsonb,
    
    -- Audit fields
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    -- Constraints
    CONSTRAINT customers_platform_customer_id_unique UNIQUE (platform, platform_customer_id)
);

-- Indexes for performance
CREATE INDEX idx_customers_platform ON customers(platform);
CREATE INDEX idx_customers_platform_customer_id ON customers(platform_customer_id);
CREATE INDEX idx_customers_email_address ON customers(email_address);
CREATE INDEX idx_customers_phone_number ON customers(phone_number);
CREATE INDEX idx_customers_first_name ON customers(first_name);
CREATE INDEX idx_customers_last_name ON customers(last_name);
CREATE INDEX idx_customers_location_id ON customers(location_id);
CREATE INDEX idx_customers_customer_since ON customers(customer_since);
CREATE INDEX idx_customers_created_at ON customers(created_at);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customers_updated_at_trigger
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_customers_updated_at();

-- Comments for documentation
COMMENT ON TABLE customers IS 'Unified customer data from Toast, Square, and Clover POS systems';
COMMENT ON COLUMN customers.platform IS 'Source platform: toast, square, or clover';
COMMENT ON COLUMN customers.platform_customer_id IS 'Original customer ID from the source platform';
COMMENT ON COLUMN customers.external_id IS 'Secondary customer identifier from platform';
COMMENT ON COLUMN customers.reference_id IS 'Reference ID for linking to external systems';
COMMENT ON COLUMN customers.given_name IS 'First name (Square terminology)';
COMMENT ON COLUMN customers.family_name IS 'Last name (Square terminology)';
COMMENT ON COLUMN customers.first_name IS 'First name (Clover terminology)';
COMMENT ON COLUMN customers.last_name IS 'Last name (Clover terminology)';
COMMENT ON COLUMN customers.customer_since IS 'Timestamp when customer was first created (Unix timestamp)';
COMMENT ON COLUMN customers.addresses IS 'Array of customer addresses in JSONB format';
COMMENT ON COLUMN customers.email_addresses IS 'Array of customer email addresses in JSONB format';
COMMENT ON COLUMN customers.phone_numbers IS 'Array of customer phone numbers in JSONB format';
COMMENT ON COLUMN customers.cards IS 'Array of customer payment cards in JSONB format';
COMMENT ON COLUMN customers.platform_data IS 'Platform-specific data that doesn''t fit standard schema';
