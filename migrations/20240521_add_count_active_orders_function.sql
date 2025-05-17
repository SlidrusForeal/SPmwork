-- Function to count active orders for a user
CREATE OR REPLACE FUNCTION public.count_active_orders(user_id text)
RETURNS integer
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    uuid_str text;
BEGIN
    -- Convert Discord-style numeric ID to UUID format
    -- Take the numeric ID, convert to hex and pad with zeros to make it UUID compatible
    uuid_str := LPAD(TO_HEX(user_id::bigint), 32, '0');
    uuid_str := SUBSTRING(uuid_str, 1, 8) || '-' ||
                SUBSTRING(uuid_str, 9, 4) || '-' ||
                SUBSTRING(uuid_str, 13, 4) || '-' ||
                SUBSTRING(uuid_str, 17, 4) || '-' ||
                SUBSTRING(uuid_str, 21);

    RETURN (
        SELECT COUNT(*)::integer
        FROM public.orders
        WHERE buyer_id = uuid_str::uuid
        AND status IN ('open'::order_status_enum, 'in_progress'::order_status_enum)
    );
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error details
        RAISE NOTICE 'Error in count_active_orders: %, SQLSTATE: %', SQLERRM, SQLSTATE;
        -- Return 0 as a safe default
        RETURN 0;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.count_active_orders(text) TO authenticated;

-- Add comment explaining the function
COMMENT ON FUNCTION public.count_active_orders(text) IS 'Counts the number of active (open or in_progress) orders for a given user ID. Handles Discord-style numeric IDs by converting them to UUID format.'; 