-- Function to get user orders with proper UUID handling and filtering
CREATE OR REPLACE FUNCTION public.get_user_orders(
    p_user_id text,
    p_page integer DEFAULT 1,
    p_limit integer DEFAULT 10,
    p_category text DEFAULT NULL,
    p_min_budget numeric DEFAULT NULL,
    p_max_budget numeric DEFAULT NULL,
    p_status text DEFAULT NULL,
    p_date_from timestamp DEFAULT NULL,
    p_date_to timestamp DEFAULT NULL,
    p_search text DEFAULT NULL
)
RETURNS json
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_offset integer;
    v_uuid uuid;
    v_result json;
    v_total integer;
    v_orders json;
BEGIN
    -- Calculate offset
    v_offset := (p_page - 1) * p_limit;

    -- Convert Discord-style numeric ID to UUID
    BEGIN
        -- Convert numeric ID to hex and format as UUID
        SELECT encode(decode(lpad(to_hex(p_user_id::bigint), 32, '0'), 'hex'), 'hex')::uuid INTO v_uuid;
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Invalid user ID format';
    END;

    -- Build the query dynamically
    WITH filtered_orders AS (
        SELECT o.*
        FROM orders o
        WHERE (o.status = 'open'::order_status_enum OR o.buyer_id = v_uuid)
        AND (p_category IS NULL OR o.category = p_category)
        AND (p_min_budget IS NULL OR o.budget >= p_min_budget)
        AND (p_max_budget IS NULL OR o.budget <= p_max_budget)
        AND (p_status IS NULL OR o.status::text = p_status)
        AND (p_date_from IS NULL OR o.created_at >= p_date_from)
        AND (p_date_to IS NULL OR o.created_at <= p_date_to)
        AND (p_search IS NULL OR o.title ILIKE '%' || p_search || '%')
    )
    SELECT 
        json_build_object(
            'orders', COALESCE((
                SELECT json_agg(t)
                FROM (
                    SELECT *
                    FROM filtered_orders
                    ORDER BY created_at DESC
                    LIMIT p_limit
                    OFFSET v_offset
                ) t
            ), '[]'::json),
            'total', (SELECT COUNT(*) FROM filtered_orders)
        ) INTO v_result;

    RETURN v_result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_orders(text, integer, integer, text, numeric, numeric, text, timestamp, timestamp, text) TO authenticated;

-- Add comment explaining the function
COMMENT ON FUNCTION public.get_user_orders IS 'Gets paginated and filtered orders for a user, handling Discord-style numeric IDs and proper UUID conversion'; 