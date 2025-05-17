-- First disable RLS temporarily
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies on the reviews table
DROP POLICY IF EXISTS "Users can view reviews" ON reviews;
DROP POLICY IF EXISTS "Users can create reviews for their orders" ON reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON reviews;
DROP POLICY IF EXISTS "System can manage all tables" ON reviews;

-- Drop existing foreign key constraints
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_reviewer_id_fkey;
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_reviewed_id_fkey;
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_order_id_fkey;

-- Change column types to UUID
ALTER TABLE reviews ALTER COLUMN reviewer_id TYPE uuid USING reviewer_id::uuid;
ALTER TABLE reviews ALTER COLUMN reviewed_id TYPE uuid USING reviewed_id::uuid;

-- Recreate foreign key constraints
ALTER TABLE reviews
ADD CONSTRAINT reviews_reviewer_id_fkey
FOREIGN KEY (reviewer_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

ALTER TABLE reviews
ADD CONSTRAINT reviews_reviewed_id_fkey
FOREIGN KEY (reviewed_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

ALTER TABLE reviews
ADD CONSTRAINT reviews_order_id_fkey
FOREIGN KEY (order_id)
REFERENCES orders(id)
ON DELETE CASCADE;

-- Recreate all policies
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
                -- Покупатель может оставить отзыв
                (orders.buyer_id = auth.uid() AND reviewed_id IN (
                    SELECT user_id FROM offers
                    WHERE order_id = orders.id
                    AND status = 'accepted'
                ))
                OR
                -- Исполнитель может оставить отзыв о покупателе
                (EXISTS (
                    SELECT 1 FROM offers
                    WHERE offers.order_id = order_id
                    AND offers.user_id = auth.uid()
                    AND offers.status = 'accepted'
                ) AND reviewed_id = orders.buyer_id)
            )
            AND orders.status = 'completed'
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

-- Re-enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY; 