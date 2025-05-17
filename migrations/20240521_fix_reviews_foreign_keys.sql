-- First disable RLS temporarily for the migration
ALTER TABLE public.reviews DISABLE ROW LEVEL SECURITY;

-- Drop existing foreign key constraints if they exist
ALTER TABLE public.reviews 
    DROP CONSTRAINT IF EXISTS reviews_reviewer_id_fkey,
    DROP CONSTRAINT IF EXISTS reviews_reviewed_id_fkey;

-- Add foreign key constraints with proper references to auth.users
ALTER TABLE public.reviews
    ADD CONSTRAINT reviews_reviewer_id_fkey 
    FOREIGN KEY (reviewer_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;

ALTER TABLE public.reviews
    ADD CONSTRAINT reviews_reviewed_id_fkey 
    FOREIGN KEY (reviewed_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;

-- Verify the order_id foreign key exists and add if missing
ALTER TABLE public.reviews
    DROP CONSTRAINT IF EXISTS reviews_order_id_fkey;

ALTER TABLE public.reviews
    ADD CONSTRAINT reviews_order_id_fkey 
    FOREIGN KEY (order_id) 
    REFERENCES public.orders(id) 
    ON DELETE CASCADE;

-- Add indexes for foreign keys if they don't exist
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON public.reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed_id ON public.reviews(reviewed_id);
CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON public.reviews(order_id);

-- Re-enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Add helpful comments
COMMENT ON CONSTRAINT reviews_reviewer_id_fkey ON public.reviews IS 'Links to the user who wrote the review';
COMMENT ON CONSTRAINT reviews_reviewed_id_fkey ON public.reviews IS 'Links to the user being reviewed';
COMMENT ON CONSTRAINT reviews_order_id_fkey ON public.reviews IS 'Links to the order this review is for'; 