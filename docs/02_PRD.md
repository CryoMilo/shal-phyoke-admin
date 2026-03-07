# Product Requirements Document (PRD): Highground Beta

## Core Features (Priority Levels)

### 1. Inventory Management (P0)
- **Real-time Stock Tracking:** Continuous updates of item quantities with low-stock threshold alerts.
- **Vendor Mapping:** Direct association of inventory items with default and alternative vendors.
- **Category Management:** Grouping of items (e.g., Meats, Vegetables, Packaging) for easier navigation.
- **Audit Logs:** Historical records of manual stock adjustments.

### 2. Procurement System (P0)
- **Automated Market List:** Generation of procurement lists based on current inventory levels vs. thresholds.
- **Vendor Workflows:** Custom item additions, vendor-specific views, and order confirmation states.
- **Procurement History:** Archival and review of past orders and vendor performance.

### 3. Order Management (P0)
- **Live Order Board:** Real-time tracking of active orders from creation to completion.
- **Order History:** Full search and filter capabilities for past customer orders.
- **Order Status Control:** Intuitive status transitions (Pending, Preparing, Ready, Delivered, Cancelled).

### 4. Menu Management (P1)
- **Dynamic Menu Control:** Enable/disable menu items based on real-time ingredient availability.
- **Weekly Menu Builder:** Scheduling and publishing functionality for recurring weekly menus.
- **Menu Images:** Support for high-quality visuals and automated image processing via AI/Gemini.

### 5. Financial Tracking (P1)
- **Daily Cash Flow:** Tracking of daily income and petty cash expenditures.
- **Overhead Management:** Record-keeping for monthly recurring costs (Rent, Salaries, Utilities).
- **Expense Breakdown:** Categorized reporting of operational expenses.

---

## User Stories

### Operations Manager
- *As an operations manager, I want to see a summary of today's performance and low-stock alerts so I can prioritize my daily tasks.*
- *As an operations manager, I want to manage vendor details and items so I can ensure my procurement process is accurate.*

### Purchasing Officer
- *As a purchasing officer, I want an automatically generated market list based on current inventory thresholds so I can save time on order planning.*
- *As a purchasing officer, I want to confirm order statuses to keep track of what has been received vs. what is pending.*

### Kitchen Staff
- *As kitchen staff, I want to update the status of an order so that the front-of-house knows when it is ready for delivery.*
- *As kitchen staff, I want to toggle menu items as 'Sold Out' if ingredients are depleted during a shift.*

---

## Acceptance Criteria
- **Real-time updates:** All inventory and order changes must reflect across all active sessions within 500ms using Supabase Real-time.
- **Mobile Responsive:** All key operational views (Order Board, Inventory) must be usable on tablets and mobile devices.
- **Validation:** No data should be saved without passing Zod schema validation to ensure data integrity.
- **Performance:** Initial dashboard load time must be under 2 seconds.

---

## Business Rules
1. **Low Stock Definition:** An item is considered 'Low Stock' when its current quantity falls below its predefined threshold value.
2. **Order Closure:** Orders cannot be archived until they are marked as 'Delivered' or 'Cancelled'.
3. **Financial Integrity:** Daily cash records cannot be modified after the daily close-out process is completed.
4. **Procurement Lock:** Market lists become read-only once an order is marked as 'Confirmed' with a vendor.
