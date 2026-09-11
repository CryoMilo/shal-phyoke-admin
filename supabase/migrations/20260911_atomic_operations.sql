-- Migration: Atomic Operations for Procurement & POS Settlements
-- Generated: 2026-09-11

-- 1. Atomic Procurement Order Arrival & Item Reconcile
CREATE OR REPLACE FUNCTION complete_procurement_order(
    p_order_id UUID,
    p_status TEXT,
    p_received_item_ids UUID[],
    p_missed_items JSONB,
    p_notes TEXT DEFAULT ''
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_missed RECORD;
BEGIN
    -- 1. Update the parent procurement order
    UPDATE procurement_orders
    SET 
        status = p_status,
        arrived_at = CASE WHEN p_status = 'arrived' THEN NOW() ELSE arrived_at END,
        notes = p_notes
    WHERE id = p_order_id;

    -- 2. Mark received items
    IF array_length(p_received_item_ids, 1) > 0 THEN
        UPDATE procurement_order_items
        SET 
            received = TRUE,
            is_missed = FALSE
        WHERE id = ANY(p_received_item_ids);
    END IF;

    -- 3. Mark missed items and recycle to market list
    IF p_missed_items IS NOT NULL AND jsonb_array_length(p_missed_items) > 0 THEN
        FOR v_missed IN SELECT * FROM jsonb_to_recordset(p_missed_items) AS (
            id UUID,
            inventory_item_id UUID,
            custom_item_name TEXT,
            quantity NUMERIC,
            unit TEXT,
            notes TEXT,
            vendor_id UUID
        )
        LOOP
            -- Mark order item as missed
            UPDATE procurement_order_items
            SET 
                received = FALSE,
                received_quantity = 0,
                is_missed = TRUE
            WHERE id = v_missed.id;

            -- Recycle back into market_list
            INSERT INTO market_list (
                inventory_item_id,
                custom_item_name,
                quantity,
                unit,
                notes,
                vendor_id,
                is_ordered
            ) VALUES (
                v_missed.inventory_item_id,
                v_missed.custom_item_name,
                v_missed.quantity,
                v_missed.unit,
                COALESCE(v_missed.notes, ''),
                v_missed.vendor_id,
                FALSE
            );
        END LOOP;
    END IF;

    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Atomic complete_procurement_order failed: %', SQLERRM;
END;
$$;

-- 2. Atomic Order Settlement & Cash Recording
CREATE OR REPLACE FUNCTION settle_pos_order(
    p_order_id UUID,
    p_payment_method TEXT,
    p_cash_amount NUMERIC DEFAULT 0
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 1. Mark order as completed and paid
    UPDATE orders
    SET 
        pos_order_status = 'completed',
        payment_status = 'paid',
        payment_method = p_payment_method,
        updated_at = NOW()
    WHERE id = p_order_id;

    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Atomic settle_pos_order failed: %', SQLERRM;
END;
$$;
