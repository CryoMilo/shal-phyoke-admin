# Database Documentation: Highground Beta

## Entity Relationship Diagram (ERD) Overview
Highground Beta utilizes a relational database schema optimized for real-time transactional operations and operational analytics.

---

## Table Descriptions

### `inventory_items`
Central table for tracking all raw materials and packaging.
- **`id` (UUID, Primary Key)**
- **`name` (String)**: Item name.
- **`category` (String)**: e.g., 'Meat', 'Vegetable', 'Packaging'.
- **`quantity` (Float)**: Current stock level.
- **`unit` (String)**: e.g., 'kg', 'pcs', 'bags'.
- **`threshold` (Float)**: Level at which low-stock alerts are triggered.
- **`default_vendor_id` (UUID, Foreign Key)**: Reference to `vendors.id`.

### `vendors`
Storage for supplier information.
- **`id` (UUID, Primary Key)**
- **`name` (String)**: Supplier business name.
- **`line_id` (String)**: Primary communication channel ID.
- **`category` (String)**: Supplier specialty.

### `orders`
Real-time customer order tracking.
- **`id` (UUID, Primary Key)**
- **`status` (Enum)**: 'Pending', 'Preparing', 'Ready', 'Delivered', 'Cancelled'.
- **`total_amount` (Float)**
- **`items` (JSONB)**: Detailed itemized list of what was ordered.
- **`customer_name` (String)**
- **`created_at` (Timestamp)**

### `menu_items`
Master list of offerings available to customers.
- **`id` (UUID, Primary Key)**
- **`name` (String)**
- **`price` (Float)**
- **`image_url` (String)**: Reference to Supabase Storage.
- **`is_available` (Boolean)**: Toggled by kitchen based on stock.

### `procurement_orders`
Tracks bulk purchases and market list history.
- **`id` (UUID, Primary Key)**
- **`vendor_id` (UUID, Foreign Key)**: Reference to `vendors.id`.
- **`status` (String)**: 'Pending', 'Confirmed', 'Received'.
- **`items` (JSONB)**: Snapshots of ordered items and quantities.

---

## Key Relationships
1. **Inventory <-> Vendor:** One-to-Many relationship. Each item has one default vendor, but a vendor can supply many items.
2. **Procurement <-> Vendor:** Many-to-One. Multiple procurement cycles can be initiated for a single vendor.
3. **Weekly Menu <-> Menu Items:** Many-to-Many. Specific items are assigned to different days within the weekly schedule.

---

## Indexes & Performance Considerations
- **Index on `inventory_items(category)`:** For fast filtering during stock audits.
- **Index on `orders(status, created_at)`:** To ensure real-time dashboards load only active orders efficiently.
- **Index on `vendors(name)`:** For rapid search during procurement workflows.
- **PostgreSQL JSONB:** Used for the `items` column in `orders` and `procurement_orders` to allow for flexible item structures without complex join operations.
