# Technical Architecture Document: Highground Beta

## System Architecture Overview
The system is built as a **Single Page Application (SPA)** utilizing a modern decoupled architecture. The frontend communicates directly with **Supabase**, leveraging its PostgreSQL engine, real-time subscriptions, and storage buckets.

---

## Technology Choices and Justifications

| Tech Stack | Choice | Justification |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 | High-performance UI rendering and future-proof concurrency features. |
| **Build Tool** | Vite | Ultra-fast development server and optimized production builds. |
| **State Management** | Zustand | Lightweight and robust state handling with minimal boilerplate compared to Redux. |
| **Styling** | Tailwind CSS v4 | Rapid UI development with utility-first classes and consistent design tokens. |
| **Routing** | TanStack Router | Type-safe routing with built-in data fetching and code-splitting. |
| **Backend / DB** | Supabase | Accelerated backend development with built-in Auth, Real-time, and Storage. |
| **AI Integration** | Google Gemini | Automated image processing and data extraction from menu uploads. |

---

## Folder Structure

```text
/
├── public/                 # Static assets (favicons, redirects)
├── src/
│   ├── assets/             # Brand logos and global images
│   ├── components/         # Reusable UI elements
│   │   ├── common/         # Modals, forms, loading states
│   │   ├── dashboard/      # Analytic cards and charts
│   │   ├── inventory/      # Inventory-specific components
│   │   ├── menu/           # Menu-related UI
│   │   ├── orders/         # Order tracking tabs
│   │   └── WeeklyMenu/     # Menu builder logic
│   ├── pages/              # Routed page components (Views)
│   ├── services/           # Supabase client and AI service logic
│   ├── stores/             # Zustand state management slices
│   ├── utils/              # Helper functions (date formatting, calculation)
│   ├── validations/        # Zod schemas for data integrity
│   ├── App.jsx             # Main application entry
│   └── router.jsx          # Route definitions
└── vite.config.js          # Build configuration
```

---

## API Integrations

### Supabase SDK
- **PostgreSQL:** Primary data storage for inventory, orders, and financial data.
- **Real-time:** Enables instant order updates and stock level monitoring across multiple devices.
- **Storage:** Used for hosting high-resolution menu and inventory item images.

### Google Gemini API
- **Gemini-1.5-Flash:** Integrated via `@google/genai` to automatically extract text from menu photos and generate structured JSON for menu creation.

---

## Security Considerations
1. **Environment Variable Protection:** All sensitive keys (Supabase, Gemini) are managed via `.env` files and never committed to source control.
2. **Row Level Security (RLS):** Supabase policies ensure users can only access data authorized for their role.
3. **Data Validation:** Zod schemas are enforced on both client-side forms and prior to database writes to prevent malformed data entry.
4. **CORS Configuration:** API access is restricted to authorized domains only (managed in Supabase dashboard).
