-- Create unified users table for Toast, Square, Clover, and 7shifts systems
CREATE TABLE IF NOT EXISTS users (
    -- Primary key
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Platform identification
    platform text NOT NULL CHECK (platform IN ('toast', 'square', 'clover', '7shifts')),
    
    -- Platform-specific user IDs
    platform_user_id text NOT NULL,
    external_id text,
    reference_id text,
    employee_id text,
    custom_id text,
    
    -- Basic user information
    first_name text,
    last_name text,
    chosen_name text,
    preferred_first_name text,
    preferred_last_name text,
    nickname text,
    pronouns text,
    email text,
    
    -- Contact information
    phone_number text,
    phone_country_code text,
    mobile_number text,
    home_number text,
    
    -- Address information
    address text,
    city text,
    state_province text,
    postal_code text,
    
    -- User status and role
    status text,
    role text,
    user_type text,
    is_owner boolean DEFAULT false,
    is_active boolean DEFAULT true,
    invite_status text,
    
    -- Employment details
    hourly_wage numeric(10,2),
    wage_type text,
    max_weekly_hours text,
    skill_level integer,
    
    -- Personal information
    birth_date date,
    timezone text,
    language text DEFAULT 'en',
    photo text,
    notes text,
    
    -- Authentication
    pin text,
    passcode text,
    
    -- Timestamps
    created_date timestamptz,
    modified_date timestamptz,
    deleted_date timestamptz,
    claimed_time timestamptz,
    invited_date timestamptz,
    invite_accepted_date timestamptz,
    
    -- Platform-specific data
    job_assignments jsonb,
    assigned_locations jsonb,
    roles jsonb,
    wage_overrides jsonb,
    permissions jsonb,
    platform_data jsonb,
    
    -- Flags
    is_deleted boolean DEFAULT false,
    invite_sent boolean DEFAULT false,
    is_new boolean DEFAULT true,
    appear_as_employee boolean DEFAULT true,
    subscribe_to_updates boolean DEFAULT true,
    push_notifications boolean DEFAULT true,
    sms_schedules boolean DEFAULT false,
    notify_overtime_risk boolean DEFAULT false,
    is_overtime_exempt boolean DEFAULT false,
    
    -- Audit fields
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    -- Constraints
    UNIQUE(platform, platform_user_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_platform ON users(platform);
CREATE INDEX IF NOT EXISTS idx_users_platform_user_id ON users(platform_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_date ON users(created_date);
CREATE INDEX IF NOT EXISTS idx_users_employee_id ON users(employee_id);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_users_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_users_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE users IS 'Unified users table for Toast, Square, Clover, and 7shifts systems';
COMMENT ON COLUMN users.platform IS 'Source system: toast, square, clover, or 7shifts';
COMMENT ON COLUMN users.platform_user_id IS 'Original user ID from the source platform';
COMMENT ON COLUMN users.job_assignments IS 'Job assignments and wage information stored as JSONB';
COMMENT ON COLUMN users.assigned_locations IS 'Location assignments stored as JSONB';
COMMENT ON COLUMN users.platform_data IS 'Additional platform-specific data that doesn''t fit standard schema';
