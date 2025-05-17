-- Indexes for orders table
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON public.orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id_status ON public.orders(buyer_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- Indexes for offers table
CREATE INDEX IF NOT EXISTS idx_offers_order_id_status ON public.offers(order_id, status);
CREATE INDEX IF NOT EXISTS idx_offers_user_id_status ON public.offers(user_id, status);
CREATE INDEX IF NOT EXISTS idx_offers_created_at ON public.offers(created_at DESC);

-- Indexes for reviews table
CREATE INDEX IF NOT EXISTS idx_reviews_order_id_rating ON public.reviews(order_id, rating);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON public.reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed_id ON public.reviews(reviewed_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating DESC);

-- Partial indexes for common queries
CREATE INDEX IF NOT EXISTS idx_orders_open_status ON public.orders(created_at DESC) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_orders_in_progress ON public.orders(created_at DESC) WHERE status = 'in_progress';
CREATE INDEX IF NOT EXISTS idx_orders_dispute ON public.orders(created_at DESC) WHERE status = 'dispute';
CREATE INDEX IF NOT EXISTS idx_offers_pending ON public.offers(created_at DESC) WHERE status = 'pending'; 