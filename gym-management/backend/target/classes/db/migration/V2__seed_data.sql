-- V2: Seed subscription plans and default owner account

INSERT INTO subscription_plans (name, duration_days, price, is_custom, is_active) VALUES
('Monthly', 30, 0, false, true),
('Quarterly', 90, 0, false, true),
('Half-Yearly', 180, 0, false, true),
('Yearly', 365, 0, false, true),
('Custom', 0, 0, true, true);

-- Default owner account (password: admin123)
INSERT INTO users (name, phone, password, role) VALUES
('Admin', '9999999999', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'OWNER');
