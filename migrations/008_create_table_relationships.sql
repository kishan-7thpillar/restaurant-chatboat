-- Create foreign key relationships between tables
-- This migration adds foreign key constraints to establish proper relationships

-- First, alter location_id columns to match the uuid type of locations.id
-- Only alter tables that actually have location_id columns
ALTER TABLE orders ALTER COLUMN location_id TYPE uuid USING location_id::uuid;
ALTER TABLE shifts ALTER COLUMN location_id TYPE uuid USING location_id::uuid;
ALTER TABLE tasks ALTER COLUMN location_id TYPE uuid USING location_id::uuid;
ALTER TABLE inventory ALTER COLUMN location_id TYPE uuid USING location_id::uuid;

-- Also fix customer_id in orders table to be uuid
ALTER TABLE orders ALTER COLUMN customer_id TYPE uuid USING customer_id::uuid;

-- Add location_id foreign key to orders table
ALTER TABLE orders 
ADD CONSTRAINT fk_orders_location_id 
FOREIGN KEY (location_id) REFERENCES locations(id);

-- Add location_id foreign key to shifts table
ALTER TABLE shifts 
ADD CONSTRAINT fk_shifts_location_id 
FOREIGN KEY (location_id) REFERENCES locations(id);

-- Add location_id foreign key to tasks table
ALTER TABLE tasks 
ADD CONSTRAINT fk_tasks_location_id 
FOREIGN KEY (location_id) REFERENCES locations(id);

-- Add location_id foreign key to inventory table
ALTER TABLE inventory 
ADD CONSTRAINT fk_inventory_location_id 
FOREIGN KEY (location_id) REFERENCES locations(id);

-- Add user relationships for orders (customer and server)
ALTER TABLE orders 
ADD CONSTRAINT fk_orders_customer_id 
FOREIGN KEY (customer_id) REFERENCES users(id);

-- Add user relationship for shifts (employee)
ALTER TABLE shifts 
ADD CONSTRAINT fk_shifts_employee_id 
FOREIGN KEY (user_id) REFERENCES users(id);

-- Add user relationship for shifts (override users)
ALTER TABLE shifts 
ADD CONSTRAINT fk_shifts_override_start_user 
FOREIGN KEY (override_start_user_id) REFERENCES users(id);

ALTER TABLE shifts 
ADD CONSTRAINT fk_shifts_override_end_user 
FOREIGN KEY (override_end_user_id) REFERENCES users(id);

-- Add user relationship for tasks (assigned user)
ALTER TABLE tasks 
ADD CONSTRAINT fk_tasks_assigned_to 
FOREIGN KEY (assigned_to) REFERENCES users(id);

-- Add product relationship for inventory
ALTER TABLE inventory 
ADD CONSTRAINT fk_inventory_product_id 
FOREIGN KEY (product_id) REFERENCES products(id);

-- Add product relationship for orders (through JSONB line_items)
-- Note: This is handled through application logic since line_items is JSONB

-- Create indexes for the new foreign keys to improve query performance
-- Only create indexes for columns that actually exist
CREATE INDEX IF NOT EXISTS idx_orders_location_id ON orders(location_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_shifts_location_id ON shifts(location_id);
CREATE INDEX IF NOT EXISTS idx_shifts_user_id ON shifts(user_id);
CREATE INDEX IF NOT EXISTS idx_shifts_override_start_user_id ON shifts(override_start_user_id);
CREATE INDEX IF NOT EXISTS idx_shifts_override_end_user_id ON shifts(override_end_user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_location_id ON tasks(location_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_inventory_location_id ON inventory(location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON inventory(product_id);

-- Add comments for documentation
COMMENT ON CONSTRAINT fk_orders_location_id ON orders IS 'Links orders to their restaurant location';
COMMENT ON CONSTRAINT fk_orders_customer_id ON orders IS 'Links orders to customer users';
COMMENT ON CONSTRAINT fk_shifts_location_id ON shifts IS 'Links shifts to their restaurant location';
COMMENT ON CONSTRAINT fk_shifts_employee_id ON shifts IS 'Links shifts to the employee working';
COMMENT ON CONSTRAINT fk_tasks_assigned_to ON tasks IS 'Links tasks to the assigned user';
COMMENT ON CONSTRAINT fk_inventory_product_id ON inventory IS 'Links inventory records to products';
