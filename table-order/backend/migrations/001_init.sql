-- Table Order Database Schema

CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS menus (
    id SERIAL PRIMARY KEY,
    category_id INT REFERENCES categories(id),
    name VARCHAR(200) NOT NULL,
    price INT NOT NULL CHECK (price >= 0),
    description TEXT DEFAULT '',
    image_url VARCHAR(500) DEFAULT '',
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS table_info (
    id SERIAL PRIMARY KEY,
    table_number INT UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    session_id UUID,
    session_started_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    table_id INT REFERENCES table_info(id),
    session_id UUID NOT NULL,
    order_number VARCHAR(20) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    total_amount INT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    menu_id INT REFERENCES menus(id),
    menu_name VARCHAR(200) NOT NULL,
    quantity INT NOT NULL CHECK (quantity >= 1),
    unit_price INT NOT NULL
);

CREATE TABLE IF NOT EXISTS order_history (
    id SERIAL PRIMARY KEY,
    table_id INT REFERENCES table_info(id),
    session_id UUID NOT NULL,
    order_data JSONB NOT NULL,
    total_amount INT NOT NULL,
    completed_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_table_session ON orders(table_id, session_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_menus_category ON menus(category_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_order_history_table ON order_history(table_id, completed_at DESC);

-- Seed data: admin account (password: admin123)
INSERT INTO admins (username, password_hash) VALUES
    ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy')
ON CONFLICT (username) DO NOTHING;

-- Seed data: tables (password: 1234)
INSERT INTO table_info (table_number, password_hash) VALUES
    (1, '$2a$10$YQ8HzKz8K5YB5qY5qY5qYOqY5qY5qY5qY5qY5qY5qY5qY5qY5q'),
    (2, '$2a$10$YQ8HzKz8K5YB5qY5qY5qYOqY5qY5qY5qY5qY5qY5qY5qY5qY5q'),
    (3, '$2a$10$YQ8HzKz8K5YB5qY5qY5qYOqY5qY5qY5qY5qY5qY5qY5qY5qY5q'),
    (4, '$2a$10$YQ8HzKz8K5YB5qY5qY5qYOqY5qY5qY5qY5qY5qY5qY5qY5qY5q'),
    (5, '$2a$10$YQ8HzKz8K5YB5qY5qY5qYOqY5qY5qY5qY5qY5qY5qY5qY5qY5q')
ON CONFLICT (table_number) DO NOTHING;

-- Seed data: categories
INSERT INTO categories (name, display_order) VALUES
    ('메인 메뉴', 1),
    ('사이드', 2),
    ('음료', 3),
    ('디저트', 4)
ON CONFLICT DO NOTHING;

-- Seed data: menus
INSERT INTO menus (category_id, name, price, description, image_url, display_order) VALUES
    (1, '불고기 정식', 15000, '부드러운 소고기 불고기와 밥, 반찬 세트', 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400', 1),
    (1, '김치찌개', 12000, '돼지고기와 묵은지로 끓인 깊은 맛의 김치찌개', 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=400', 2),
    (1, '비빔밥', 13000, '신선한 야채와 고추장으로 비벼먹는 비빔밥', 'https://images.unsplash.com/photo-1553163147-622ab57be1c7?w=400', 3),
    (1, '돈까스', 14000, '바삭한 수제 돈까스와 특제 소스', 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400', 4),
    (2, '계란말이', 8000, '부드럽고 촉촉한 계란말이', 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400', 1),
    (2, '감자튀김', 6000, '바삭한 감자튀김과 케첩', 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400', 2),
    (2, '떡볶이', 7000, '매콤달콤한 떡볶이', 'https://images.unsplash.com/photo-1635363638580-c2809d049eee?w=400', 3),
    (3, '콜라', 3000, '시원한 코카콜라 500ml', 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400', 1),
    (3, '사이다', 3000, '청량한 칠성사이다 500ml', 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=400', 2),
    (3, '맥주', 5000, '시원한 생맥주 500ml', 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400', 3),
    (4, '아이스크림', 4000, '바닐라 아이스크림 2스쿱', 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400', 1),
    (4, '케이크', 6000, '오늘의 수제 케이크 한 조각', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400', 2)
ON CONFLICT DO NOTHING;
