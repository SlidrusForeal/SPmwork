BEGIN;

-- Lock tables in a specific order to prevent deadlocks
LOCK TABLE public.orders, public.reviews, public.offers IN ACCESS EXCLUSIVE MODE;

-- Drop existing type if it exists
DROP TYPE IF EXISTS public.order_status_enum CASCADE;

-- Create order status enum in public schema
CREATE TYPE public.order_status_enum AS ENUM ('open', 'in_progress', 'completed', 'dispute');

-- Create a function to safely convert to enum
CREATE OR REPLACE FUNCTION public.to_order_status(text) RETURNS public.order_status_enum AS $$
BEGIN
    RETURN CASE
        WHEN $1 = 'open' THEN 'open'::public.order_status_enum
        WHEN $1 = 'in_progress' THEN 'in_progress'::public.order_status_enum
        WHEN $1 = 'completed' THEN 'completed'::public.order_status_enum
        WHEN $1 = 'dispute' THEN 'dispute'::public.order_status_enum
        ELSE 'open'::public.order_status_enum
    END;
EXCEPTION
    WHEN invalid_text_representation THEN
        RETURN 'open'::public.order_status_enum;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Drop all policies on reviews table
DROP POLICY IF EXISTS "Users can view reviews" ON reviews;
DROP POLICY IF EXISTS "Users can create reviews for their orders" ON reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON reviews;

-- Update orders table to use the enum
ALTER TABLE public.orders ADD COLUMN status_new public.order_status_enum;
  
-- Update the new column using the conversion function with explicit casting
UPDATE public.orders 
SET status_new = public.to_order_status(status::text);
  
-- Drop the old status column and rename the new one
ALTER TABLE public.orders DROP COLUMN status CASCADE;
ALTER TABLE public.orders RENAME COLUMN status_new TO status;

-- Add NOT NULL constraints where needed
ALTER TABLE public.orders
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN buyer_id SET NOT NULL;

-- Add default status
ALTER TABLE public.orders
  ALTER COLUMN status SET DEFAULT 'open'::public.order_status_enum;

-- Add missing indexes
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON public.orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- Fix reviews table constraints
UPDATE public.reviews SET rating = 1 WHERE rating IS NULL;
  
-- Add NOT NULL constraints
ALTER TABLE public.reviews
  ALTER COLUMN reviewer_id SET NOT NULL,
  ALTER COLUMN reviewed_id SET NOT NULL,
  ALTER COLUMN order_id SET NOT NULL,
  ALTER COLUMN rating SET NOT NULL;

-- Drop existing rating check constraint if it exists
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_rating_check;

-- Add check constraint for rating
ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_rating_check 
  CHECK (rating >= 1 AND rating <= 5);

-- Recreate the policies
CREATE POLICY "Users can view reviews"
    ON reviews FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = reviews.order_id
            AND (
                orders.buyer_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM offers
                    WHERE offers.order_id = reviews.order_id
                    AND offers.user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can create reviews for their orders"
    ON reviews FOR INSERT
    TO authenticated
    WITH CHECK (
        reviewer_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = order_id
            AND (
                -- Buyer can leave a review
                (orders.buyer_id = auth.uid() AND reviewed_id IN (
                    SELECT user_id FROM offers
                    WHERE order_id = orders.id
                    AND status = 'accepted'
                ))
                OR
                -- Seller can leave a review about the buyer
                (EXISTS (
                    SELECT 1 FROM offers
                    WHERE offers.order_id = order_id
                    AND offers.user_id = auth.uid()
                    AND offers.status = 'accepted'
                ) AND reviewed_id = orders.buyer_id)
            )
            AND orders.status = 'completed'::public.order_status_enum
        )
    );

CREATE POLICY "Users can update their own reviews"
    ON reviews FOR UPDATE
    TO authenticated
    USING (reviewer_id = auth.uid())
    WITH CHECK (reviewer_id = auth.uid());

CREATE POLICY "Users can delete their own reviews"
    ON reviews FOR DELETE
    TO authenticated
    USING (reviewer_id = auth.uid());

-- Drop the conversion function as it's no longer needed
DROP FUNCTION IF EXISTS public.to_order_status(text);

-- Add comment
COMMENT ON TYPE public.order_status_enum IS 'Valid order statuses: open, in_progress, completed, dispute';

COMMIT; 