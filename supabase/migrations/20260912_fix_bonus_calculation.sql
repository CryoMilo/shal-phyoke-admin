-- ============================================================================
-- Migration: Fix Employee Monthly Bonus Calculation & Overhead Amortization
-- Filename: 20260912_fix_bonus_calculation.sql
-- Description:
--   Recalculates month-to-date profit by accurately deducting daily amortized 
--   monthly overheads (e.g. ฿342,100 / 26 operating days = ฿13,157.69/day * elapsed open days).
--   This ensures the Bonus Tracker exactly matches the Dashboard's True Net Profit.
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_monthly_employee_bonuses(
    p_bonus_month DATE
)
RETURNS TABLE (
    out_employee_id UUID,
    out_final_bonus NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_month_start DATE;
    v_month_end DATE;
    v_today_bangkok DATE;
    v_eval_end DATE;
    
    v_opening_days INT[];
    v_total_open_days_in_month INT;
    v_elapsed_open_days INT;
    
    v_total_monthly_overheads NUMERIC := 0.0;
    v_daily_overhead NUMERIC := 0.0;
    v_cumulative_overhead NUMERIC := 0.0;
    
    v_total_income NUMERIC := 0.0;
    v_total_daily_expenses NUMERIC := 0.0;
    v_net_profit NUMERIC := 0.0;
    
    v_pool_pct NUMERIC := 10.0;
    v_allowed_abs NUMERIC := 1.0;
    v_penalty_tiers JSONB := '{"2": 50, "3": 75, "4": 100}'::jsonb;
    v_total_bonus_pool NUMERIC := 0.0;
    
    v_active_count INT := 0;
    v_equal_share NUMERIC := 0.0;
    v_base_share NUMERIC := 0.0;
    
    v_emp RECORD;
    v_emp_absence_pts NUMERIC;
    v_emp_penalty_pct NUMERIC;
    v_emp_forfeited NUMERIC;
    v_emp_retained NUMERIC;
    
    v_tier_threshold NUMERIC;
    v_tier_penalty NUMERIC;
    
    v_total_forfeited NUMERIC := 0.0;
    v_clean_count INT := 0;
    v_redistribution_share NUMERIC := 0.0;
    
    v_rec RECORD;
BEGIN
    -- 1. Date boundaries (aligned to Asia/Bangkok time)
    v_month_start := DATE_TRUNC('month', p_bonus_month)::date;
    v_month_end := (DATE_TRUNC('month', p_bonus_month) + INTERVAL '1 month - 1 day')::date;
    v_today_bangkok := (NOW() AT TIME ZONE 'Asia/Bangkok')::date;

    -- If target month is current month, evaluate up to today; otherwise, whole month
    IF DATE_TRUNC('month', v_today_bangkok) = v_month_start THEN
        v_eval_end := v_today_bangkok;

        -- If today has no completed orders or daily expenses recorded yet,
        -- evaluate up to yesterday to prevent premature daily overhead deduction resetting the pool
        IF NOT EXISTS (
            SELECT 1 FROM orders 
            WHERE pos_order_status = 'completed' 
              AND payment_status = 'paid' 
              AND (created_at AT TIME ZONE 'Asia/Bangkok')::date = v_today_bangkok
        ) AND NOT EXISTS (
            SELECT 1 FROM daily_expenses 
            WHERE date::date = v_today_bangkok
        ) AND v_today_bangkok > v_month_start THEN
            v_eval_end := v_today_bangkok - 1;
        END IF;
    ELSE
        v_eval_end := v_month_end;
    END IF;

    -- 2. Retrieve store opening days from app_settings (default: Mon-Sat [1,2,3,4,5,6], Sunday closed)
    v_opening_days := ARRAY[1, 2, 3, 4, 5, 6];
    BEGIN
        SELECT ARRAY(
            SELECT jsonb_array_elements_text(value->'openingDays')::int
        )
        INTO v_opening_days
        FROM app_settings
        WHERE key = 'sidebar_permissions' AND value ? 'openingDays';
    EXCEPTION
        WHEN OTHERS THEN
            v_opening_days := ARRAY[1, 2, 3, 4, 5, 6];
    END;

    IF v_opening_days IS NULL OR array_length(v_opening_days, 1) IS NULL THEN
        v_opening_days := ARRAY[1, 2, 3, 4, 5, 6];
    END IF;

    -- 3. Calculate total operating days in this month
    SELECT COUNT(*)::int
    INTO v_total_open_days_in_month
    FROM generate_series(v_month_start, v_month_end, '1 day'::interval) AS d
    WHERE EXTRACT(DOW FROM d)::int = ANY(v_opening_days);

    IF v_total_open_days_in_month = 0 THEN
        v_total_open_days_in_month := 26;
    END IF;

    -- 4. Calculate elapsed operating days up to evaluation date
    SELECT COUNT(*)::int
    INTO v_elapsed_open_days
    FROM generate_series(v_month_start, v_eval_end, '1 day'::interval) AS d
    WHERE EXTRACT(DOW FROM d)::int = ANY(v_opening_days);

    -- 5. Calculate monthly overhead amortization
    SELECT COALESCE(SUM(amount), 0)
    INTO v_total_monthly_overheads
    FROM monthly_overheads
    WHERE DATE_TRUNC('month', month::date) = v_month_start;

    v_daily_overhead := v_total_monthly_overheads / v_total_open_days_in_month;
    v_cumulative_overhead := v_daily_overhead * v_elapsed_open_days;

    -- 6. Calculate total income from completed & paid orders
    SELECT COALESCE(SUM(total_amount - COALESCE(delivery_fee, 0)), 0)
    INTO v_total_income
    FROM orders
    WHERE pos_order_status = 'completed'
      AND payment_status = 'paid'
      AND (created_at AT TIME ZONE 'Asia/Bangkok')::date >= v_month_start
      AND (created_at AT TIME ZONE 'Asia/Bangkok')::date <= v_eval_end;

    -- 7. Calculate total daily expenses
    SELECT COALESCE(SUM(amount), 0)
    INTO v_total_daily_expenses
    FROM daily_expenses
    WHERE date::date >= v_month_start
      AND date::date <= v_eval_end;

    -- 8. Compute True Net Profit (Income - Daily Expenses - Cumulative Prorated Overhead)
    v_net_profit := v_total_income - v_total_daily_expenses - v_cumulative_overhead;

    -- 9. Bonus configuration (pull latest active rule or default to 10%)
    BEGIN
        SELECT 
            COALESCE(pool_percentage, 10.0),
            COALESCE(allowed_absences, 1.0),
            COALESCE(penalty_tiers, '{"2": 50, "3": 75, "4": 100}'::jsonb)
        INTO 
            v_pool_pct,
            v_allowed_abs,
            v_penalty_tiers
        FROM bonus_config
        WHERE effective_from <= v_eval_end
          AND (effective_to IS NULL OR effective_to >= v_eval_end)
        ORDER BY effective_from DESC
        LIMIT 1;
    EXCEPTION
        WHEN OTHERS THEN
            v_pool_pct := 10.0;
            v_allowed_abs := 1.0;
            v_penalty_tiers := '{"2": 50, "3": 75, "4": 100}'::jsonb;
    END;

    IF v_pool_pct IS NULL THEN
        v_pool_pct := 10.0;
        v_allowed_abs := 1.0;
        v_penalty_tiers := '{"2": 50, "3": 75, "4": 100}'::jsonb;
    END IF;

    -- 10. Determine Total Bonus Pool
    IF v_net_profit > 0 THEN
        v_total_bonus_pool := ROUND((v_net_profit * (v_pool_pct / 100.0)), 2);
    ELSE
        v_total_bonus_pool := 0.00;
    END IF;

    -- 11. Active Employees count
    SELECT COUNT(*)::int INTO v_active_count FROM employees WHERE is_active = TRUE;

    IF v_active_count > 0 THEN
        v_equal_share := ROUND((100.0 / v_active_count), 2);
    ELSE
        v_equal_share := 0.00;
    END IF;

    -- Create temporary table for individual bonus math
    CREATE TEMP TABLE temp_bonus_calc (
        emp_id UUID,
        share_pct NUMERIC,
        absence_pts NUMERIC,
        penalty_pct NUMERIC,
        base_amt NUMERIC,
        forfeited_amt NUMERIC,
        retained_amt NUMERIC,
        final_amt NUMERIC
    ) ON COMMIT DROP;

    IF v_active_count > 0 AND v_total_bonus_pool > 0 THEN
        v_base_share := ROUND((v_total_bonus_pool / v_active_count), 2);

        -- Calculate penalties per active employee
        FOR v_emp IN SELECT id FROM employees WHERE is_active = TRUE ORDER BY name LOOP
            -- Absences on open operating days
            SELECT COALESCE(SUM(points), 0)
            INTO v_emp_absence_pts
            FROM employee_absences
            WHERE employee_id = v_emp.id
              AND absence_date::date >= v_month_start
              AND absence_date::date <= v_eval_end
              AND EXTRACT(DOW FROM absence_date::date)::int = ANY(v_opening_days);

            -- Determine penalty percentage from tiers
            v_emp_penalty_pct := 0.0;
            IF v_emp_absence_pts > v_allowed_abs THEN
                FOR v_tier_threshold, v_tier_penalty IN
                    SELECT key::numeric, value::numeric
                    FROM jsonb_each_text(v_penalty_tiers)
                    ORDER BY key::numeric ASC
                LOOP
                    IF v_emp_absence_pts >= v_tier_threshold THEN
                        v_emp_penalty_pct := v_tier_penalty;
                    END IF;
                END LOOP;
            END IF;

            v_emp_forfeited := ROUND((v_base_share * (v_emp_penalty_pct / 100.0)), 2);
            v_emp_retained := v_base_share - v_emp_forfeited;

            INSERT INTO temp_bonus_calc VALUES (
                v_emp.id,
                v_equal_share,
                v_emp_absence_pts,
                v_emp_penalty_pct,
                v_base_share,
                v_emp_forfeited,
                v_emp_retained,
                v_emp_retained
            );
        END LOOP;

        -- Redistribute forfeited penalties to staff with 0% penalty (clean attendance)
        SELECT COALESCE(SUM(forfeited_amt), 0) INTO v_total_forfeited FROM temp_bonus_calc;
        SELECT COUNT(*)::int INTO v_clean_count FROM temp_bonus_calc WHERE penalty_pct = 0;

        IF v_clean_count > 0 AND v_total_forfeited > 0 THEN
            v_redistribution_share := ROUND((v_total_forfeited / v_clean_count), 2);
            UPDATE temp_bonus_calc
            SET final_amt = retained_amt + v_redistribution_share
            WHERE penalty_pct = 0;
        END IF;

    ELSE
        -- 0 pool or no employees
        FOR v_emp IN SELECT id FROM employees WHERE is_active = TRUE ORDER BY name LOOP
            INSERT INTO temp_bonus_calc VALUES (
                v_emp.id,
                v_equal_share,
                0.0,
                0.0,
                0.0,
                0.0,
                0.0,
                0.0
            );
        END LOOP;
    END IF;

    -- 12. Save persistent records into employee_bonus_log
    DELETE FROM employee_bonus_log WHERE bonus_month = v_month_start;

    FOR v_rec IN SELECT * FROM temp_bonus_calc ORDER BY emp_id LOOP
        INSERT INTO employee_bonus_log (
            bonus_month,
            employee_id,
            total_bonus_pool,
            employee_share_percentage,
            base_bonus_amount,
            absence_points,
            penalty_percentage,
            final_bonus_amount,
            config_snapshot
        ) VALUES (
            v_month_start,
            v_rec.emp_id,
            v_total_bonus_pool,
            v_rec.share_pct,
            v_rec.base_amt,
            v_rec.absence_pts,
            v_rec.penalty_pct,
            v_rec.final_amt,
            jsonb_build_object(
                'pool_percentage', v_pool_pct,
                'allowed_absences', v_allowed_abs,
                'penalty_tiers', v_penalty_tiers,
                'month_to_date_profit', v_net_profit,
                'cumulative_overhead', v_cumulative_overhead,
                'total_income', v_total_income,
                'total_daily_expenses', v_total_daily_expenses,
                'elapsed_open_days', v_elapsed_open_days,
                'daily_overhead', v_daily_overhead
            )
        );

        out_employee_id := v_rec.emp_id;
        out_final_bonus := v_rec.final_amt;
        RETURN NEXT;
    END LOOP;

    DROP TABLE IF EXISTS temp_bonus_calc;
    RETURN;
END;
$$;
