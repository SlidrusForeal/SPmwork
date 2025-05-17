-- Create process_payment function with transaction handling
CREATE OR REPLACE FUNCTION process_payment(
    p_order_id UUID,
    p_amount DECIMAL,
    p_card_number TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order_status TEXT;
BEGIN
    -- Start transaction
    BEGIN
        -- Lock the order row for update
        SELECT status INTO v_order_status
        FROM orders
        WHERE id = p_order_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Order not found';
        END IF;

        IF v_order_status != 'pending' THEN
            RAISE EXCEPTION 'Order is not in pending status (current status: %)', v_order_status;
        END IF;

        -- Update order
        UPDATE orders
        SET 
            status = 'in_progress',
            paid_amount = p_amount,
            paid_at = NOW(),
            payer_card = p_card_number,
            updated_at = NOW()
        WHERE id = p_order_id;

        -- Insert payment record
        INSERT INTO payments (
            order_id,
            amount,
            card_number,
            status,
            created_at
        ) VALUES (
            p_order_id,
            p_amount,
            p_card_number,
            'completed',
            NOW()
        );

        -- Commit happens automatically if no errors
    EXCEPTION WHEN OTHERS THEN
        -- Log the error
        INSERT INTO error_logs (
            error_message,
            error_detail,
            error_hint,
            error_context,
            created_at
        ) VALUES (
            SQLERRM,
            SQLSTATE,
            'process_payment error',
            format('order_id: %s, amount: %s', p_order_id, p_amount),
            NOW()
        );
        RAISE; -- Re-throw the error
    END;
END;
$$; 