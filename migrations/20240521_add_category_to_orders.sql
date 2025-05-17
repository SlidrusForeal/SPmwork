-- Add category column to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS category text;

-- Create index for category searches
CREATE INDEX IF NOT EXISTS idx_orders_category ON public.orders(category);

-- Add comment
COMMENT ON COLUMN public.orders.category IS 'Category of the order (e.g. development, design, etc.)';

-- Create categories enum type for validation
CREATE TYPE public.order_category_enum AS ENUM (
    'development',
    'design',
    'writing',
    'marketing',
    'other'
);

-- Add check constraint to ensure valid categories
ALTER TABLE public.orders 
    ADD CONSTRAINT orders_category_check 
    CHECK (category IS NULL OR category = ANY(enum_range(NULL::order_category_enum)::text[]));

-- Update existing rows to have a default category if needed
UPDATE public.orders SET category = 'other' WHERE category IS NULL; 