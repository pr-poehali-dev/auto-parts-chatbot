CREATE TABLE t_p78841365_auto_parts_chatbot.products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    article VARCHAR(100) NOT NULL UNIQUE,
    compatible_cars TEXT[],
    description TEXT,
    price NUMERIC(10, 2),
    stock_quantity INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);