# Future Roadmap: Highground Beta

Following the successful pilot of the Beta version, Highground has identified several strategic growth areas for the project.

---

## Planned Features

### 1. Multi-Location Support (Q3 2026)
- **Centralized Management:** Manage multiple outlets from a single master dashboard.
- **Inter-branch Transfers:** Functionality to transfer inventory between locations.
- **Regional Analytics:** Compare performance metrics across different geographic areas.

### 2. Advanced AI Forecasting (Q4 2026)
- **Predictive Ordering:** Use historical sales data and Gemini-powered analytics to predict future stock needs.
- **Waste Reduction AI:** Identify patterns in order cancellations and stock expirations to minimize waste.
- **Automated Price Adjustments:** Suggest menu price updates based on fluctuating ingredient costs from procurement history.

### 3. Integrated Delivery Dispatch (Q1 2027)
- **Direct Integration:** Seamless connection with 3rd party delivery services (Grab, FoodPanda).
- **In-house Driver App:** A dedicated mobile application for internal delivery staff with GPS tracking.

---

## Enhancements

### User Experience
- **Dark Mode Support:** Implementation of a native dark theme for low-light kitchen environments.
- **Offline Mode:** Local-first data caching to allow operations to continue during temporary internet outages.
- **Customizable Dashboards:** Allow users to drag-and-drop widgets on their home screen to prioritize the metrics they care about most.

### Technical Performance
- **WebSocket Optimization:** Further refinement of Supabase real-time channels for high-volume order days.
- **Micro-frontend Architecture:** Transitioning to a modular architecture to allow independent deployment of the Inventory and Finance modules.

---

## Scaling Considerations
- **Global Data Replication:** Implementing read-replicas in different regions to ensure low latency as we expand.
- **Enterprise-Grade Security:** Adding SAML/SSO integration for larger corporate clients.
- **IoT Integration:** Connecting smart kitchen scales and refrigerators directly to the inventory system for automated stock updates.
