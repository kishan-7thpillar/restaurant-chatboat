-- Insert comprehensive mock data for restaurant analytics
-- This script creates realistic data for a week to support analytical queries

-- Create a location using the provided auth.users ID
INSERT INTO locations (id, user_id, name, created_at, updated_at) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'bf1f0e65-4749-4b00-8d5c-5e4d33e52413', 'Main Restaurant', NOW(), NOW());

-- Insert users (employees and customers)
INSERT INTO users (id, platform, platform_user_id, first_name, last_name, email, phone_number, role, user_type, hourly_wage, is_active, created_at) VALUES 
('550e8400-e29b-41d4-a716-446655440010', 'toast', 'emp_001', 'John', 'Manager', 'john.manager@restaurant.com', '+1234567890', 'manager', 'employee', 25.00, true, NOW()),
('550e8400-e29b-41d4-a716-446655440011', 'toast', 'emp_002', 'Sarah', 'Chef', 'sarah.chef@restaurant.com', '+1234567891', 'chef', 'employee', 22.00, true, NOW()),
('550e8400-e29b-41d4-a716-446655440012', 'toast', 'emp_003', 'Mike', 'Server', 'mike.server@restaurant.com', '+1234567892', 'server', 'employee', 15.00, true, NOW()),
('550e8400-e29b-41d4-a716-446655440013', 'toast', 'emp_004', 'Lisa', 'Server', 'lisa.server@restaurant.com', '+1234567893', 'server', 'employee', 15.00, true, NOW()),
('550e8400-e29b-41d4-a716-446655440014', 'toast', 'emp_005', 'Tom', 'Cook', 'tom.cook@restaurant.com', '+1234567894', 'cook', 'employee', 18.00, true, NOW()),
('550e8400-e29b-41d4-a716-446655440015', 'toast', 'emp_006', 'Emma', 'Cashier', 'emma.cashier@restaurant.com', '+1234567895', 'cashier', 'employee', 14.00, true, NOW()),
('550e8400-e29b-41d4-a716-446655440016', 'toast', 'emp_007', 'David', 'Cleaner', 'david.cleaner@restaurant.com', '+1234567896', 'cleaner', 'employee', 13.00, true, NOW()),
('550e8400-e29b-41d4-a716-446655440017', 'toast', 'emp_008', 'Amy', 'Server', 'amy.server@restaurant.com', '+1234567897', 'server', 'employee', 15.00, true, NOW()),
('550e8400-e29b-41d4-a716-446655440018', 'toast', 'emp_009', 'Chris', 'Cook', 'chris.cook@restaurant.com', '+1234567898', 'cook', 'employee', 18.00, true, NOW()),
('550e8400-e29b-41d4-a716-446655440019', 'toast', 'emp_010', 'Jessica', 'Host', 'jessica.host@restaurant.com', '+1234567899', 'host', 'employee', 14.00, true, NOW()),
-- Customers
('550e8400-e29b-41d4-a716-446655440020', 'square', 'cust_001', 'Alice', 'Johnson', 'alice@email.com', '+1987654321', 'customer', 'customer', NULL, true, NOW()),
('550e8400-e29b-41d4-a716-446655440021', 'square', 'cust_002', 'Bob', 'Smith', 'bob@email.com', '+1987654322', 'customer', 'customer', NULL, true, NOW()),
('550e8400-e29b-41d4-a716-446655440022', 'square', 'cust_003', 'Carol', 'Davis', 'carol@email.com', '+1987654323', 'customer', 'customer', NULL, true, NOW());

-- Insert products (menu items)
INSERT INTO products (id, platform, platform_product_id, name, description, price, cost, sku, category_name, is_available, calories, prep_time, created_at) VALUES 
('650e8400-e29b-41d4-a716-446655440000', 'toast', 'prod_001', 'Classic Burger', 'Beef patty with lettuce, tomato, cheese', 12.99, 4.50, 'BURG001', 'Burgers', true, 650, 8, NOW()),
('650e8400-e29b-41d4-a716-446655440001', 'toast', 'prod_002', 'Chicken Caesar Salad', 'Grilled chicken with romaine and caesar dressing', 11.99, 3.80, 'SAL001', 'Salads', true, 420, 5, NOW()),
('650e8400-e29b-41d4-a716-446655440002', 'toast', 'prod_003', 'Margherita Pizza', '12" pizza with tomato sauce, mozzarella, basil', 14.99, 5.20, 'PIZ001', 'Pizza', true, 800, 12, NOW()),
('650e8400-e29b-41d4-a716-446655440003', 'toast', 'prod_004', 'Fish & Chips', 'Beer battered cod with fries', 15.99, 6.00, 'FISH001', 'Seafood', true, 750, 10, NOW()),
('650e8400-e29b-41d4-a716-446655440004', 'toast', 'prod_005', 'Pasta Carbonara', 'Spaghetti with bacon, eggs, parmesan', 13.99, 4.20, 'PAST001', 'Pasta', true, 680, 9, NOW()),
('650e8400-e29b-41d4-a716-446655440005', 'toast', 'prod_006', 'Chicken Wings', '8 pieces with buffalo sauce', 9.99, 3.50, 'WING001', 'Appetizers', true, 520, 6, NOW()),
('650e8400-e29b-41d4-a716-446655440006', 'toast', 'prod_007', 'Chocolate Cake', 'Rich chocolate layer cake', 6.99, 2.10, 'DESS001', 'Desserts', true, 450, 2, NOW()),
('650e8400-e29b-41d4-a716-446655440007', 'toast', 'prod_008', 'Craft Beer', 'Local IPA on tap', 5.99, 1.80, 'BEV001', 'Beverages', true, 180, 1, NOW()),
('650e8400-e29b-41d4-a716-446655440008', 'toast', 'prod_009', 'House Salad', 'Mixed greens with house dressing', 7.99, 2.40, 'SAL002', 'Salads', false, 150, 3, NOW()),
('650e8400-e29b-41d4-a716-446655440009', 'toast', 'prod_010', 'Steak Dinner', '8oz ribeye with vegetables', 24.99, 12.00, 'STEAK001', 'Entrees', true, 920, 15, NOW());

-- Insert inventory
INSERT INTO inventory (id, platform, platform_inventory_id, product_id, name, sku, stock_count, reorder_threshold, unit_name, cost, location_id, is_available, created_at) VALUES 
('750e8400-e29b-41d4-a716-446655440000', 'clover', 'inv_001', '650e8400-e29b-41d4-a716-446655440000', 'Burger Patties', 'BURG001', 45, 20, 'pieces', 4.50, '550e8400-e29b-41d4-a716-446655440000', true, NOW()),
('750e8400-e29b-41d4-a716-446655440001', 'clover', 'inv_002', '650e8400-e29b-41d4-a716-446655440001', 'Chicken Breast', 'CHICK001', 15, 25, 'lbs', 3.80, '550e8400-e29b-41d4-a716-446655440000', true, NOW()),
('750e8400-e29b-41d4-a716-446655440002', 'clover', 'inv_003', '650e8400-e29b-41d4-a716-446655440002', 'Pizza Dough', 'PIZ001', 8, 15, 'pieces', 5.20, '550e8400-e29b-41d4-a716-446655440000', true, NOW()),
('750e8400-e29b-41d4-a716-446655440003', 'clover', 'inv_004', '650e8400-e29b-41d4-a716-446655440003', 'Cod Fillets', 'FISH001', 12, 20, 'pieces', 6.00, '550e8400-e29b-41d4-a716-446655440000', true, NOW()),
('750e8400-e29b-41d4-a716-446655440004', 'clover', 'inv_005', '650e8400-e29b-41d4-a716-446655440004', 'Pasta', 'PAST001', 25, 30, 'lbs', 4.20, '550e8400-e29b-41d4-a716-446655440000', true, NOW()),
('750e8400-e29b-41d4-a716-446655440005', 'clover', 'inv_006', '650e8400-e29b-41d4-a716-446655440005', 'Chicken Wings', 'WING001', 18, 25, 'lbs', 3.50, '550e8400-e29b-41d4-a716-446655440000', true, NOW()),
('750e8400-e29b-41d4-a716-446655440006', 'clover', 'inv_007', '650e8400-e29b-41d4-a716-446655440006', 'Chocolate Cake', 'DESS001', 6, 10, 'pieces', 2.10, '550e8400-e29b-41d4-a716-446655440000', true, NOW()),
('750e8400-e29b-41d4-a716-446655440007', 'clover', 'inv_008', '650e8400-e29b-41d4-a716-446655440007', 'Craft Beer', 'BEV001', 24, 30, 'bottles', 1.80, '550e8400-e29b-41d4-a716-446655440000', true, NOW()),
('750e8400-e29b-41d4-a716-446655440008', 'clover', 'inv_009', '650e8400-e29b-41d4-a716-446655440008', 'Mixed Greens', 'SAL002', 8, 15, 'lbs', 2.40, '550e8400-e29b-41d4-a716-446655440000', true, NOW()),
('750e8400-e29b-41d4-a716-446655440009', 'clover', 'inv_010', '650e8400-e29b-41d4-a716-446655440009', 'Ribeye Steak', 'STEAK001', 5, 12, 'pieces', 12.00, '550e8400-e29b-41d4-a716-446655440000', true, NOW());
