CREATE OR REPLACE FUNCTION public.accept_offer(
    p_offer_id uuid,
    p_order_id uuid,
    p_new_status public.order_status_enum
) RETURNS void AS $$
BEGIN
    -- Set explicit search path
    SET search_path = 'public';
    
    -- Begin transaction
    BEGIN
        -- Update offer status
        UPDATE public.offers
        SET status = 'accepted'
        WHERE id = p_offer_id;

        -- Update order status
        UPDATE public.orders
        SET status = p_new_status
        WHERE id = p_order_id;

        -- Reject all other offers for this order
        UPDATE public.offers
        SET status = 'rejected'
        WHERE order_id = p_order_id
        AND id != p_offer_id
        AND status = 'pending';

        -- If any of the above fails, the transaction will be rolled back
    EXCEPTION WHEN OTHERS THEN
        -- Reset search path before raising exception
        SET search_path = DEFAULT;
        RAISE EXCEPTION 'Failed to accept offer: %', SQLERRM;
    END;
    
    -- Reset search path
    SET search_path = DEFAULT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public; 