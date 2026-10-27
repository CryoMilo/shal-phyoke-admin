-- ============================================================================
-- MIGRATION: ADD ITEM_TYPE TO INVENTORY_ITEMS
-- Distinguish between culinary recipe ingredients, packaging, and operational supplies
-- ============================================================================

ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS item_type text NOT NULL DEFAULT 'ingredient'
  CHECK (item_type IN ('ingredient', 'packaging', 'operational_supply'));

CREATE INDEX IF NOT EXISTS idx_inventory_items_item_type ON public.inventory_items(item_type);

-- Auto-classify existing packaging items
UPDATE public.inventory_items
SET item_type = 'packaging'
WHERE LOWER(category) IN ('packaging', 'box', 'boxes', 'bag', 'bags')
   OR LOWER(unit) IN ('box', 'bag', 'cup', 'lid', 'can', 'carrier', 'pouch');

-- Auto-classify existing operational supplies
UPDATE public.inventory_items
SET item_type = 'operational_supply'
WHERE LOWER(category) IN ('cleaning', 'hardware', 'hardware & supplies', 'sanitation', 'stationery', 'office');

-- ============================================================================
-- UPGRADE KITCHEN_PREP_LOGS FOR RAW SPOILAGE & PHOTO PROOF
-- ============================================================================

ALTER TABLE public.kitchen_prep_logs
  ALTER COLUMN recipe_id DROP NOT NULL;

ALTER TABLE public.kitchen_prep_logs
  ADD COLUMN IF NOT EXISTS inventory_item_id uuid REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS log_type text DEFAULT 'prep' CHECK (log_type IN ('prep', 'spoilage'));

CREATE INDEX IF NOT EXISTS idx_kitchen_prep_logs_type ON public.kitchen_prep_logs(log_type);
CREATE INDEX IF NOT EXISTS idx_kitchen_prep_logs_inv ON public.kitchen_prep_logs(inventory_item_id);
