-- Create unified tasks table for restaurant task management systems
CREATE TABLE IF NOT EXISTS tasks (
    -- Primary key
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Platform identification
    platform text NOT NULL CHECK (platform IN ('7shifts', 'toast', 'square', 'clover')),
    
    -- Platform-specific task IDs
    platform_task_id text NOT NULL,
    task_template_uuid text,
    
    -- Task list information
    task_list_id uuid,
    task_list_title text,
    task_list_template_uuid text,
    
    -- Basic task information
    title text NOT NULL,
    description text,
    status text DEFAULT 'pending',
    priority text,
    
    -- Assignment information
    assigned_to uuid REFERENCES users(id),
    platform_user_id text,
    
    -- Time information
    start_time timestamptz,
    due_time timestamptz,
    completed_at timestamptz,
    
    -- Location and department information
    location_id text,
    department_id text,
    role_id text,
    company_id text,
    
    -- Task completion information
    completion_type text,
    completion_value text,
    completion_unit text,
    
    -- Recurrence information
    recurrence_interval text,
    recurrence_rule text,
    
    -- Time frame information
    time_frame_start time,
    time_frame_end time,
    
    -- Tags and additional data
    tags jsonb,
    assignments jsonb,
    platform_data jsonb,
    
    -- Audit fields
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    -- Constraints
    UNIQUE(platform, platform_task_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_platform ON tasks(platform);
CREATE INDEX IF NOT EXISTS idx_tasks_platform_task_id ON tasks(platform_task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_time ON tasks(due_time);
CREATE INDEX IF NOT EXISTS idx_tasks_task_list_id ON tasks(task_list_id);
CREATE INDEX IF NOT EXISTS idx_tasks_location_id ON tasks(location_id);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tasks_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tasks_updated_at 
    BEFORE UPDATE ON tasks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_tasks_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE tasks IS 'Unified tasks table for restaurant task management systems';
COMMENT ON COLUMN tasks.platform IS 'Source system: 7shifts, toast, square, or clover';
COMMENT ON COLUMN tasks.platform_task_id IS 'Original task ID from the source platform';
COMMENT ON COLUMN tasks.assigned_to IS 'Foreign key reference to the users table';
COMMENT ON COLUMN tasks.tags IS 'Task tags stored as JSONB for flexibility across platforms';
COMMENT ON COLUMN tasks.assignments IS 'Task assignments stored as JSONB';
COMMENT ON COLUMN tasks.platform_data IS 'Additional platform-specific data that doesn''t fit standard schema';
