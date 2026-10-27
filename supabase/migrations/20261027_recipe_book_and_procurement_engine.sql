-- ============================================================================
-- STEP 1: INTERCONNECTED RECIPE BOOK & INVENTORY BACKEND UPGRADE
-- WITH INDEX SAFEGUARDS & RLS POLICIES (ADMIN & STAFF FACING ONLY)
-- Filename: 20261027_recipe_book_and_procurement_engine.sql
-- ============================================================================

-- 1. MASTER MEASUREMENT UNITS DICTIONARY (Bilingual)
CREATE TABLE IF NOT EXISTS public.measurement_units (
  code text PRIMARY KEY,
  name_burmese text NOT NULL,
  name_english text NOT NULL,
  unit_category text NOT NULL CHECK (unit_category IN ('weight', 'volume', 'count', 'packaging', 'informal', 'batch')),
  base_unit_code text,
  default_base_multiplier numeric
);

INSERT INTO public.measurement_units (code, name_burmese, name_english, unit_category, base_unit_code, default_base_multiplier)
VALUES
  ('g', 'ဂရမ်', 'Gram (g)', 'weight', 'g', 1),
  ('kg', 'ကီလိုဂရမ်', 'Kilogram (kg)', 'weight', 'g', 1000),
  ('viss', 'ပိဿာ', 'Viss', 'weight', 'g', 1630),
  ('ml', 'မီလီလီတာ', 'Milliliter (ml)', 'volume', 'ml', 1),
  ('liter', 'လီတာ', 'Liter (L)', 'volume', 'ml', 1000),
  ('tsp', 'လက်ဖက်ရည်ဇွန်း', 'Teaspoon (tsp)', 'volume', 'g', 5),
  ('tbsp', 'စားပွဲတင်ဇွန်း', 'Tablespoon (tbsp)', 'volume', 'g', 15),
  ('serving_spoon', 'ဟင်းခတ်ဇွန်း', 'Serving Spoon', 'volume', 'g', 45),
  ('cup', 'ခွက်', 'Cup', 'volume', 'g', 200),
  ('handful', 'လက်တစ်ဆုပ်', 'Handful', 'informal', 'g', 30),
  ('sprinkle', 'ဖြူးရုံ / အနည်းငယ်', 'Sprinkle / Pinch', 'informal', 'g', 2),
  ('pack', 'ထုပ်', 'Pack', 'packaging', 'pack', 1),
  ('piece', 'ခု / လုံး', 'Piece', 'count', 'piece', 1),
  ('can', 'ဘူး', 'Can / Tin', 'packaging', 'piece', 1),
  ('bottle', 'ပုလင်း', 'Bottle', 'packaging', 'piece', 1),
  ('bundle', 'စည်း', 'Bundle', 'packaging', 'piece', 1),
  ('pot', 'အိုး', 'Pot (Batch)', 'batch', 'pot', 1),
  ('portion', 'ပွဲ', 'Portion / Bowl', 'batch', 'portion', 1)
ON CONFLICT (code) DO NOTHING;

-- 2. UPGRADE EXISTING public.inventory_items TABLE
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'inventory_items' AND column_name = 'name'
  ) THEN
    ALTER TABLE public.inventory_items RENAME COLUMN name TO name_english;
  END IF;
END $$;

ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS name_burmese text,
  ADD COLUMN IF NOT EXISTS base_unit text NOT NULL DEFAULT 'g',
  ADD COLUMN IF NOT EXISTS base_quantity_per_unit numeric NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS cost_per_unit numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS order_cycle_days integer NOT NULL DEFAULT 1;

UPDATE public.inventory_items 
SET name_burmese = name_english 
WHERE name_burmese IS NULL;

ALTER TABLE public.inventory_items 
ALTER COLUMN name_burmese SET NOT NULL;

-- 3. UPGRADE EXISTING public.procurement_order_items TABLE
ALTER TABLE public.procurement_order_items
  ADD COLUMN IF NOT EXISTS unit_price numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_price numeric DEFAULT 0;

-- 4. ITEM-SPECIFIC UNIT CONVERSIONS (Scoop / Pack Overrides)
CREATE TABLE IF NOT EXISTS public.item_unit_conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  unit_code text NOT NULL REFERENCES public.measurement_units(code),
  multiplier_to_base numeric NOT NULL CHECK (multiplier_to_base > 0),
  units_per_purchase_pack numeric,
  notes text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT item_unit_conversions_unique UNIQUE (inventory_item_id, unit_code)
);

-- 5. INTERCONNECTED RECIPES TABLE (Menu Preps & Branch Preps)
CREATE TABLE IF NOT EXISTS public.recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_burmese text NOT NULL,
  name_english text NOT NULL,
  recipe_type text NOT NULL CHECK (recipe_type IN ('menu_prep', 'branch_prep')),
  menu_item_id uuid UNIQUE REFERENCES public.menu_items(id) ON DELETE SET NULL,
  yield_quantity numeric NOT NULL DEFAULT 1 CHECK (yield_quantity > 0),
  yield_unit text NOT NULL DEFAULT 'portion' REFERENCES public.measurement_units(code),
  image_url text,
  prep_time_minutes integer DEFAULT 15,
  shelf_life_days integer DEFAULT 1,
  instructions_burmese text,
  instructions_english text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6. RECIPE COMPONENTS TABLE (The Directed Edges)
CREATE TABLE IF NOT EXISTS public.recipe_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_recipe_id uuid NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  component_type text NOT NULL CHECK (component_type IN ('inventory_item', 'sub_recipe')),
  inventory_item_id uuid REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
  sub_recipe_id uuid REFERENCES public.recipes(id) ON DELETE RESTRICT,
  quantity numeric NOT NULL CHECK (quantity > 0),
  unit text NOT NULL REFERENCES public.measurement_units(code),
  waste_percentage numeric NOT NULL DEFAULT 0 CHECK (waste_percentage >= 0 AND waste_percentage < 100),
  sort_order integer DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT recipe_components_target_check CHECK (
    (component_type = 'inventory_item' AND inventory_item_id IS NOT NULL AND sub_recipe_id IS NULL) OR
    (component_type = 'sub_recipe' AND sub_recipe_id IS NOT NULL AND inventory_item_id IS NULL)
  ),
  CONSTRAINT recipe_components_no_self_loop CHECK (parent_recipe_id <> sub_recipe_id)
);

-- 7. TRIGGER: PREVENT CIRCULAR DEPENDENCIES IN RECIPES
CREATE OR REPLACE FUNCTION public.check_recipe_cycle()
RETURNS trigger AS $$
DECLARE
  cycle_found boolean;
BEGIN
  IF NEW.component_type = 'sub_recipe' THEN
    WITH RECURSIVE graph_walk AS (
      SELECT rc.sub_recipe_id
      FROM public.recipe_components rc
      WHERE rc.parent_recipe_id = NEW.sub_recipe_id AND rc.component_type = 'sub_recipe'
      UNION
      SELECT rc.sub_recipe_id
      FROM public.recipe_components rc
      INNER JOIN graph_walk gw ON gw.sub_recipe_id = rc.parent_recipe_id
      WHERE rc.component_type = 'sub_recipe'
    )
    SELECT EXISTS (
      SELECT 1 FROM graph_walk WHERE sub_recipe_id = NEW.parent_recipe_id
    ) INTO cycle_found;

    IF cycle_found THEN
      RAISE EXCEPTION 'Circular recipe dependency detected: Sub-recipe cannot directly or indirectly consume its parent recipe.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_recipe_cycle ON public.recipe_components;
CREATE TRIGGER trg_prevent_recipe_cycle
  BEFORE INSERT OR UPDATE ON public.recipe_components
  FOR EACH ROW EXECUTE FUNCTION public.check_recipe_cycle();

-- 8. STAFF PREP & PHYSICAL STOCK AUDIT TABLES
CREATE TABLE IF NOT EXISTS public.kitchen_prep_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  recipe_id uuid NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  batches_produced numeric NOT NULL DEFAULT 1,
  quantity_produced numeric NOT NULL,
  unit text NOT NULL,
  waste_quantity numeric NOT NULL DEFAULT 0,
  waste_reason text,
  recorded_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inventory_stock_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_date date NOT NULL DEFAULT CURRENT_DATE,
  inventory_item_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  theoretical_closing_qty numeric NOT NULL,
  actual_closing_qty numeric NOT NULL,
  variance_qty numeric GENERATED ALWAYS AS (actual_closing_qty - theoretical_closing_qty) STORED,
  variance_cost numeric NOT NULL DEFAULT 0,
  waste_reason text,
  audited_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- PERFORMANCE SAFEGUARDS: PERFORMANCE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_recipe_components_parent ON public.recipe_components(parent_recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_components_sub_recipe ON public.recipe_components(sub_recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_components_inv_item ON public.recipe_components(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_recipes_menu_item ON public.recipes(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_recipes_type ON public.recipes(recipe_type);
CREATE INDEX IF NOT EXISTS idx_item_unit_conversions_item ON public.item_unit_conversions(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_kitchen_prep_logs_date ON public.kitchen_prep_logs(log_date);
CREATE INDEX IF NOT EXISTS idx_inventory_stock_audits_date ON public.inventory_stock_audits(audit_date);

-- ============================================================================
-- SECURITY: ROW LEVEL SECURITY (RLS) POLICIES
-- Admin & Staff Facing Only (Requires Authenticated Session)
-- ============================================================================

-- Enable RLS on all related tables
ALTER TABLE public.measurement_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_unit_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kitchen_prep_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_stock_audits ENABLE ROW LEVEL SECURITY;

-- 1. Measurement Units (Read-only for all authenticated staff/admins)
DROP POLICY IF EXISTS "Authenticated users can view measurement units" ON public.measurement_units;
CREATE POLICY "Authenticated users can view measurement units"
  ON public.measurement_units FOR SELECT
  TO authenticated
  USING (true);

-- 2. Inventory Items (Full access for authenticated staff/admins)
DROP POLICY IF EXISTS "Staff and Admin inventory access" ON public.inventory_items;
CREATE POLICY "Staff and Admin inventory access"
  ON public.inventory_items FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 3. Item Unit Conversions (Full access for authenticated staff/admins)
DROP POLICY IF EXISTS "Staff and Admin unit conversion access" ON public.item_unit_conversions;
CREATE POLICY "Staff and Admin unit conversion access"
  ON public.item_unit_conversions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 4. Recipes (Full access for authenticated staff/admins)
DROP POLICY IF EXISTS "Staff and Admin recipe access" ON public.recipes;
CREATE POLICY "Staff and Admin recipe access"
  ON public.recipes FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 5. Recipe Components (Full access for authenticated staff/admins)
DROP POLICY IF EXISTS "Staff and Admin recipe components access" ON public.recipe_components;
CREATE POLICY "Staff and Admin recipe components access"
  ON public.recipe_components FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 6. Kitchen Prep Logs (Full access for authenticated staff/admins)
DROP POLICY IF EXISTS "Staff and Admin prep logs access" ON public.kitchen_prep_logs;
CREATE POLICY "Staff and Admin prep logs access"
  ON public.kitchen_prep_logs FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 7. Inventory Stock Audits (Full access for authenticated staff/admins)
DROP POLICY IF EXISTS "Staff and Admin stock audits access" ON public.inventory_stock_audits;
CREATE POLICY "Staff and Admin stock audits access"
  ON public.inventory_stock_audits FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 9. RPC FUNCTION: EXPLODE RECIPE BOM DOWN TO RAW PURCHASE UNITS & COST
-- ============================================================================

CREATE OR REPLACE FUNCTION public.explode_recipe_bom(target_recipe_id uuid)
RETURNS TABLE (
  inventory_item_id uuid,
  name_burmese text,
  name_english text,
  vendor_id uuid,
  purchase_unit text,
  total_purchase_units_required numeric,
  unit_cost numeric,
  total_cost numeric
) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE bom_tree AS (
    SELECT
      rc.parent_recipe_id,
      rc.component_type,
      rc.inventory_item_id,
      rc.sub_recipe_id,
      rc.quantity,
      rc.unit,
      rc.waste_percentage,
      1.0::numeric AS batch_scaling_factor,
      1 AS depth
    FROM public.recipe_components rc
    WHERE rc.parent_recipe_id = target_recipe_id

    UNION ALL

    SELECT
      child.parent_recipe_id,
      child.component_type,
      child.inventory_item_id,
      child.sub_recipe_id,
      child.quantity,
      child.unit,
      child.waste_percentage,
      (parent_tree.batch_scaling_factor * (parent_tree.quantity / NULLIF(sub_r.yield_quantity, 0)) * (1.0 + (parent_tree.waste_percentage / 100.0)))::numeric AS batch_scaling_factor,
      parent_tree.depth + 1
    FROM public.recipe_components child
    JOIN bom_tree parent_tree ON parent_tree.sub_recipe_id = child.parent_recipe_id
    JOIN public.recipes sub_r ON sub_r.id = parent_tree.sub_recipe_id
    WHERE parent_tree.component_type = 'sub_recipe' AND parent_tree.depth < 10
  ),
  resolved_raw_items AS (
    SELECT
      inv.id AS inv_id,
      inv.name_burmese AS inv_name_mm,
      inv.name_english AS inv_name_en,
      inv.default_vendor_id,
      inv.unit AS inv_purchase_unit,
      inv.cost_per_unit,
      (
        bt.quantity * bt.batch_scaling_factor * (1.0 + (bt.waste_percentage / 100.0)) *
        CASE
          WHEN bt.unit = inv.unit THEN 1.0
          WHEN iuc.multiplier_to_base IS NOT NULL THEN (iuc.multiplier_to_base / NULLIF(inv.base_quantity_per_unit, 0))
          WHEN mu.default_base_multiplier IS NOT NULL THEN (mu.default_base_multiplier / NULLIF(inv.base_quantity_per_unit, 0))
          ELSE (1.0 / NULLIF(inv.base_quantity_per_unit, 0))
        END
      ) AS purchase_units_used
    FROM bom_tree bt
    JOIN public.inventory_items inv ON inv.id = bt.inventory_item_id
    LEFT JOIN public.item_unit_conversions iuc ON iuc.inventory_item_id = inv.id AND iuc.unit_code = bt.unit
    LEFT JOIN public.measurement_units mu ON mu.code = bt.unit
    WHERE bt.component_type = 'inventory_item'
  )
  SELECT
    rri.inv_id,
    rri.inv_name_mm,
    rri.inv_name_en,
    rri.default_vendor_id,
    rri.inv_purchase_unit,
    ROUND(SUM(rri.purchase_units_used), 5) AS total_purchase_units_required,
    rri.cost_per_unit,
    ROUND(SUM(rri.purchase_units_used * rri.cost_per_unit), 2) AS total_cost
  FROM resolved_raw_items rri
  GROUP BY rri.inv_id, rri.inv_name_mm, rri.inv_name_en, rri.default_vendor_id, rri.inv_purchase_unit, rri.cost_per_unit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execution permissions only to authenticated users
REVOKE EXECUTE ON FUNCTION public.explode_recipe_bom(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.explode_recipe_bom(uuid) TO authenticated;
