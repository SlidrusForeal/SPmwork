-- Function to count active orders for a user
CREATE OR REPLACE FUNCTION public.count_active_orders(user_id text)
RETURNS integer
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::integer
        FROM public.orders
        WHERE buyer_id = user_id::uuid
        AND status IN ('open'::order_status_enum, 'in_progress'::order_status_enum)
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.count_active_orders(text) TO authenticated;

-- Add comment explaining the function
COMMENT ON FUNCTION public.count_active_orders(text) IS 'Counts the number of active (open or in_progress) orders for a given user ID'; 