-- Migration: Customer Profiles, Delivery Autocomplete & Customer Analytics
-- Generated: 2026-09-12
-- Optimization: Server-side rollups and lightweight RPCs to minimize Supabase egress bandwidth

-- ============================================================================
-- 1. Create Customers Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    delivery_address TEXT,
    default_notes TEXT,
    
    -- Pre-calculated Analytics & Rollups (maintained by database triggers for zero client egress)
    total_orders INTEGER NOT NULL DEFAULT 0,
    total_spent NUMERIC NOT NULL DEFAULT 0,
    first_order_at TIMESTAMP WITH TIME ZONE,
    last_order_at TIMESTAMP WITH TIME ZONE,
    
    -- Structured analytical summaries
    frequent_notes JSONB DEFAULT '[]'::jsonb,   -- Array of { "note": text, "count": int }
    favorite_items JSONB DEFAULT '[]'::jsonb,   -- Array of { "name": text, "count": int }
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT customers_pkey PRIMARY KEY (id)
);

-- Indexes for ultra-fast autocomplete, search, and dashboard sorting
CREATE INDEX IF NOT EXISTS idx_customers_lower_name ON public.customers (lower(trim(name)));
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers (phone);
CREATE INDEX IF NOT EXISTS idx_customers_total_orders ON public.customers (total_orders DESC);
CREATE INDEX IF NOT EXISTS idx_customers_total_spent ON public.customers (total_spent DESC);
CREATE INDEX IF NOT EXISTS idx_customers_last_order_at ON public.customers (last_order_at DESC NULLS LAST);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Allow full access to authenticated staff and admin
DROP POLICY IF EXISTS "Allow authenticated full access to customers" ON public.customers;
CREATE POLICY "Allow authenticated full access to customers"
    ON public.customers
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Fallback policy for anon (e.g. POS kiosk if running without user session)
DROP POLICY IF EXISTS "Allow anon read/write to customers" ON public.customers;
CREATE POLICY "Allow anon read/write to customers"
    ON public.customers
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- 2. Link Orders to Customers
-- ============================================================================
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);

-- ============================================================================
-- 3. Automatic Customer Sync & Analytics Rollup Function (Zero-Egress)
-- ============================================================================
CREATE OR REPLACE FUNCTION recalculate_customer_metrics(p_customer_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_orders INT;
    v_total_spent NUMERIC;
    v_first_order TIMESTAMP WITH TIME ZONE;
    v_last_order TIMESTAMP WITH TIME ZONE;
    v_latest_address TEXT;
    v_latest_notes TEXT;
    v_frequent_notes JSONB;
    v_favorite_items JSONB;
BEGIN
    IF p_customer_id IS NULL THEN
        RETURN;
    END IF;

    -- Compute order counts and spend (only completed orders count toward revenue; all count toward order frequency)
    SELECT 
        COUNT(*),
        COALESCE(SUM(CASE WHEN pos_order_status = 'completed' THEN total_amount ELSE 0 END), 0),
        MIN(created_at),
        MAX(created_at)
    INTO 
        v_total_orders,
        v_total_spent,
        v_first_order,
        v_last_order
    FROM public.orders
    WHERE customer_id = p_customer_id
      AND pos_order_status != 'cancelled';

    -- Retrieve most recent delivery address and order notes
    SELECT delivery_address, notes
    INTO v_latest_address, v_latest_notes
    FROM public.orders
    WHERE customer_id = p_customer_id
      AND (delivery_address IS NOT NULL AND trim(delivery_address) != ''
           OR notes IS NOT NULL AND trim(notes) != '')
    ORDER BY created_at DESC
    LIMIT 1;

    -- Aggregate top frequent order notes (filtering out blanks)
    SELECT COALESCE(jsonb_agg(sub), '[]'::jsonb)
    INTO v_frequent_notes
    FROM (
        SELECT trim(notes) AS note, COUNT(*) AS count
        FROM public.orders
        WHERE customer_id = p_customer_id
          AND notes IS NOT NULL 
          AND trim(notes) != ''
          AND pos_order_status != 'cancelled'
        GROUP BY trim(notes)
        ORDER BY count DESC
        LIMIT 5
    ) sub;

    -- Aggregate top favorite items from order_items JSONB array
    SELECT COALESCE(jsonb_agg(sub), '[]'::jsonb)
    INTO v_favorite_items
    FROM (
        SELECT 
            COALESCE(item->>'name_burmese', item->>'name_english', 'Item') AS name,
            SUM(COALESCE((item->>'quantity')::int, 1)) AS count
        FROM public.orders o,
             jsonb_array_elements(o.order_items) AS item
        WHERE o.customer_id = p_customer_id
          AND o.pos_order_status != 'cancelled'
        GROUP BY COALESCE(item->>'name_burmese', item->>'name_english', 'Item')
        ORDER BY count DESC
        LIMIT 5
    ) sub;

    -- Update the customer record atomically in database
    UPDATE public.customers
    SET 
        total_orders = COALESCE(v_total_orders, 0),
        total_spent = COALESCE(v_total_spent, 0),
        first_order_at = v_first_order,
        last_order_at = v_last_order,
        delivery_address = COALESCE(v_latest_address, delivery_address),
        default_notes = COALESCE(v_latest_notes, default_notes),
        frequent_notes = v_frequent_notes,
        favorite_items = v_favorite_items,
        updated_at = NOW()
    WHERE id = p_customer_id;
END;
$$;

-- Trigger to link and update customer record when an order is created or updated
CREATE OR REPLACE FUNCTION trg_sync_order_customer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_customer_id UUID;
    v_clean_name TEXT;
    v_clean_phone TEXT;
BEGIN
    v_clean_name := trim(COALESCE(NEW.customer_name, ''));
    v_clean_phone := trim(COALESCE(NEW.customer_phone, ''));

    -- Only process orders with customer information
    IF v_clean_name != '' OR v_clean_phone != '' THEN
        -- 1. Try to find existing customer by customer_id if already linked
        v_customer_id := NEW.customer_id;

        -- 2. Match by phone if phone is provided
        IF v_customer_id IS NULL AND v_clean_phone != '' THEN
            SELECT id INTO v_customer_id
            FROM public.customers
            WHERE phone = v_clean_phone
            LIMIT 1;
        END IF;

        -- 3. Match by name if phone not matched
        IF v_customer_id IS NULL AND v_clean_name != '' THEN
            SELECT id INTO v_customer_id
            FROM public.customers
            WHERE lower(trim(name)) = lower(v_clean_name)
            LIMIT 1;
        END IF;

        -- 4. Create new customer if not found
        IF v_customer_id IS NULL THEN
            INSERT INTO public.customers (
                name,
                phone,
                delivery_address,
                default_notes,
                first_order_at,
                last_order_at,
                created_at,
                updated_at
            ) VALUES (
                CASE WHEN v_clean_name != '' THEN v_clean_name ELSE 'Customer ' || right(v_clean_phone, 4) END,
                NULLIF(v_clean_phone, ''),
                NULLIF(trim(NEW.delivery_address), ''),
                NULLIF(trim(NEW.notes), ''),
                NEW.created_at,
                NEW.created_at,
                NOW(),
                NOW()
            )
            RETURNING id INTO v_customer_id;
        ELSE
            -- Update address & phone if new information is present
            UPDATE public.customers
            SET 
                phone = COALESCE(NULLIF(v_clean_phone, ''), phone),
                delivery_address = COALESCE(NULLIF(trim(NEW.delivery_address), ''), delivery_address),
                default_notes = COALESCE(NULLIF(trim(NEW.notes), ''), default_notes),
                updated_at = NOW()
            WHERE id = v_customer_id;
        END IF;

        -- Ensure order has customer_id set
        NEW.customer_id := v_customer_id;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_before_sync_customer ON public.orders;
CREATE TRIGGER trg_orders_before_sync_customer
    BEFORE INSERT OR UPDATE OF customer_name, customer_phone, delivery_address, notes
    ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION trg_sync_order_customer();

-- After insert/update/delete trigger to recalculate customer metrics
CREATE OR REPLACE FUNCTION trg_recalc_customer_after_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF (TG_OP = 'DELETE' OR TG_OP = 'UPDATE') AND OLD.customer_id IS NOT NULL THEN
        PERFORM recalculate_customer_metrics(OLD.customer_id);
    END IF;

    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.customer_id IS NOT NULL THEN
        PERFORM recalculate_customer_metrics(NEW.customer_id);
    END IF;

    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_after_recalc_customer ON public.orders;
CREATE TRIGGER trg_orders_after_recalc_customer
    AFTER INSERT OR UPDATE OF customer_id, total_amount, pos_order_status, notes, order_items
    ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION trg_recalc_customer_after_order();

-- ============================================================================
-- 4. Lightweight Autocomplete Search RPC (Minimizes Egress to < 1 KB)
-- ============================================================================
CREATE OR REPLACE FUNCTION search_customers(
    p_query TEXT,
    p_limit INT DEFAULT 8
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    phone TEXT,
    delivery_address TEXT,
    default_notes TEXT,
    total_orders INT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.phone,
        c.delivery_address,
        c.default_notes,
        c.total_orders
    FROM public.customers c
    WHERE 
        p_query IS NULL 
        OR trim(p_query) = ''
        OR c.name ILIKE '%' || trim(p_query) || '%'
        OR c.phone ILIKE '%' || trim(p_query) || '%'
    ORDER BY 
        CASE 
            WHEN lower(c.name) = lower(trim(p_query)) THEN 1
            WHEN lower(c.name) LIKE lower(trim(p_query)) || '%' THEN 2
            WHEN c.phone LIKE trim(p_query) || '%' THEN 3
            ELSE 4
        END,
        c.total_orders DESC,
        c.last_order_at DESC NULLS LAST
    LIMIT p_limit;
END;
$$;

-- ============================================================================
-- 5. Full Customer Dashboard Analytics Overview RPC (Single tiny JSON payload)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_customer_dashboard_overview()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_customers', COUNT(*),
        'repeat_customers', COUNT(*) FILTER (WHERE total_orders > 1),
        'repeat_rate_percentage', CASE 
            WHEN COUNT(*) > 0 
            THEN ROUND((COUNT(*) FILTER (WHERE total_orders > 1)::numeric / COUNT(*)::numeric) * 100, 1)
            ELSE 0 
        END,
        'total_delivery_revenue', COALESCE(SUM(total_spent), 0),
        'avg_customer_ltv', CASE 
            WHEN COUNT(*) > 0 
            THEN ROUND(COALESCE(SUM(total_spent), 0) / COUNT(*)::numeric, 2)
            ELSE 0 
        END,
        'most_active_customer', (
            SELECT jsonb_build_object('name', name, 'total_orders', total_orders, 'total_spent', total_spent)
            FROM public.customers
            ORDER BY total_orders DESC, total_spent DESC
            LIMIT 1
        )
    )
    INTO v_result
    FROM public.customers;

    RETURN v_result;
END;
$$;

-- ============================================================================
-- 6. Backfill Historical Customers from Existing Orders (Idempotent)
-- ============================================================================
DO $$
DECLARE
    v_order RECORD;
    v_customer_id UUID;
    v_clean_name TEXT;
    v_clean_phone TEXT;
BEGIN
    FOR v_order IN 
        SELECT id, customer_name, customer_phone, delivery_address, notes, created_at
        FROM public.orders
        WHERE customer_id IS NULL
          AND ((customer_name IS NOT NULL AND trim(customer_name) != '')
               OR (customer_phone IS NOT NULL AND trim(customer_phone) != ''))
        ORDER BY created_at ASC
    LOOP
        v_clean_name := trim(COALESCE(v_order.customer_name, ''));
        v_clean_phone := trim(COALESCE(v_order.customer_phone, ''));
        v_customer_id := NULL;

        -- Match by phone first
        IF v_clean_phone != '' THEN
            SELECT id INTO v_customer_id
            FROM public.customers
            WHERE phone = v_clean_phone
            LIMIT 1;
        END IF;

        -- Match by name second
        IF v_customer_id IS NULL AND v_clean_name != '' THEN
            SELECT id INTO v_customer_id
            FROM public.customers
            WHERE lower(trim(name)) = lower(v_clean_name)
            LIMIT 1;
        END IF;

        -- Insert if new
        IF v_customer_id IS NULL THEN
            INSERT INTO public.customers (
                name,
                phone,
                delivery_address,
                default_notes,
                first_order_at,
                last_order_at,
                created_at,
                updated_at
            ) VALUES (
                CASE WHEN v_clean_name != '' THEN v_clean_name ELSE 'Customer ' || right(v_clean_phone, 4) END,
                NULLIF(v_clean_phone, ''),
                NULLIF(trim(v_order.delivery_address), ''),
                NULLIF(trim(v_order.notes), ''),
                v_order.created_at,
                v_order.created_at,
                v_order.created_at,
                NOW()
            )
            RETURNING id INTO v_customer_id;
        END IF;

        -- Link order
        UPDATE public.orders
        SET customer_id = v_customer_id
        WHERE id = v_order.id;
    END LOOP;

    -- Recalculate metrics for all backfilled customers
    FOR v_customer_id IN SELECT id FROM public.customers LOOP
        PERFORM recalculate_customer_metrics(v_customer_id);
    END LOOP;
END;
$$;
