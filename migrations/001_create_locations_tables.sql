-- Migration: Create locations and integrations tables
-- Description: Tables to store restaurant locations and their integration configurations

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create locations table
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create integrations table
CREATE TABLE IF NOT EXISTS integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    integration_type VARCHAR(50) NOT NULL CHECK (integration_type IN ('posSystem', 'taskTraining', 'scheduling', 'financialManagement')),
    provider_type VARCHAR(50) NOT NULL,
    api_key_hash TEXT NOT NULL, -- Encrypted/hashed API key
    connection_status VARCHAR(20) DEFAULT 'Checking...' CHECK (connection_status IN ('Checking...', 'Connected', 'Disconnected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(location_id, integration_type)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_locations_user_id ON locations(user_id);
CREATE INDEX IF NOT EXISTS idx_integrations_location_id ON integrations(location_id);
CREATE INDEX IF NOT EXISTS idx_integrations_type ON integrations(integration_type);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_locations_updated_at 
    BEFORE UPDATE ON locations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integrations_updated_at 
    BEFORE UPDATE ON integrations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for locations
CREATE POLICY "Users can view their own locations" ON locations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own locations" ON locations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own locations" ON locations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own locations" ON locations
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for integrations
CREATE POLICY "Users can view integrations for their locations" ON integrations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM locations 
            WHERE locations.id = integrations.location_id 
            AND locations.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert integrations for their locations" ON integrations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM locations 
            WHERE locations.id = integrations.location_id 
            AND locations.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update integrations for their locations" ON integrations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM locations 
            WHERE locations.id = integrations.location_id 
            AND locations.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete integrations for their locations" ON integrations
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM locations 
            WHERE locations.id = integrations.location_id 
            AND locations.user_id = auth.uid()
        )
    );

-- Insert sample data (optional - remove in production)
-- This is just for testing purposes
/*
INSERT INTO locations (user_id, name) VALUES 
    ('00000000-0000-0000-0000-000000000000', 'Downtown Outlet'),
    ('00000000-0000-0000-0000-000000000000', 'Mall Location');
*/
