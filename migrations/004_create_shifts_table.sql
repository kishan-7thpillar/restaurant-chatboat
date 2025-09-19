-- Create unified shifts table for Toast, Square, Clover, and 7shifts systems
CREATE TABLE IF NOT EXISTS shifts (
    -- Primary key
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Platform identification
    platform text NOT NULL CHECK (platform IN ('toast', 'square', 'clover', '7shifts')),
    
    -- Platform-specific shift IDs
    platform_shift_id text NOT NULL,
    external_id text,
    
    -- User reference (foreign key to users table)
    user_id uuid REFERENCES users(id),
    platform_user_id text,
    
    -- Basic shift information
    start_time timestamptz NOT NULL,
    end_time timestamptz,
    
    -- Location and role information
    location_id text,
    department_id text,
    role_id text,
    job_id text,
    station_id text,
    station_name text,
    
    -- Shift status
    status text,
    attendance_status text,
    publish_status text,
    is_draft boolean DEFAULT false,
    is_deleted boolean DEFAULT false,
    is_open boolean DEFAULT false,
    is_unassigned boolean DEFAULT false,
    is_close boolean DEFAULT false,
    
    -- Financial information
    hourly_wage numeric(10,2),
    cash_tips_collected numeric(10,2),
    
    -- Time tracking
    actual_start_time timestamptz,
    actual_end_time timestamptz,
    override_start_time timestamptz,
    override_end_time timestamptz,
    override_start_user_id uuid REFERENCES users(id),
    override_end_user_id uuid REFERENCES users(id),
    late_minutes integer,
    
    -- Additional information
    notes text,
    timezone text,
    skill_level integer,
    open_offer_type text,
    server_banking boolean DEFAULT false,
    
    -- Breaks information (stored as JSONB for flexibility)
    breaks jsonb,
    
    -- Schedule configuration
    min_before_clock_in integer,
    min_after_clock_in integer,
    min_before_clock_out integer,
    min_after_clock_out integer,
    
    -- Timestamps
    created_date timestamptz,
    modified_date timestamptz,
    deleted_date timestamptz,
    soft_deleted_date timestamptz,
    
    -- Platform-specific data
    platform_data jsonb,
    
    -- Audit fields
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    -- Constraints
    UNIQUE(platform, platform_shift_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_shifts_platform ON shifts(platform);
CREATE INDEX IF NOT EXISTS idx_shifts_platform_shift_id ON shifts(platform_shift_id);
CREATE INDEX IF NOT EXISTS idx_shifts_user_id ON shifts(user_id);
CREATE INDEX IF NOT EXISTS idx_shifts_platform_user_id ON shifts(platform_user_id);
CREATE INDEX IF NOT EXISTS idx_shifts_start_time ON shifts(start_time);
CREATE INDEX IF NOT EXISTS idx_shifts_end_time ON shifts(end_time);
CREATE INDEX IF NOT EXISTS idx_shifts_location_id ON shifts(location_id);
CREATE INDEX IF NOT EXISTS idx_shifts_status ON shifts(status);
CREATE INDEX IF NOT EXISTS idx_shifts_created_date ON shifts(created_date);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_shifts_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_shifts_updated_at 
    BEFORE UPDATE ON shifts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_shifts_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE shifts IS 'Unified shifts table for Toast, Square, Clover, and 7shifts systems';
COMMENT ON COLUMN shifts.platform IS 'Source system: toast, square, clover, or 7shifts';
COMMENT ON COLUMN shifts.platform_shift_id IS 'Original shift ID from the source platform';
COMMENT ON COLUMN shifts.user_id IS 'Foreign key reference to the users table';
COMMENT ON COLUMN shifts.platform_user_id IS 'Original user ID from the source platform';
COMMENT ON COLUMN shifts.breaks IS 'Break information stored as JSONB for flexibility across platforms';
COMMENT ON COLUMN shifts.platform_data IS 'Additional platform-specific data that doesn''t fit standard schema';
