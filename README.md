# VenueCrowd | v2.1 Premium 🏟️

Smart venue crowd management and optimization system leveraging Google Services for a seamless attendee experience.

## ✨ Key Improvements (v2.1 Refactor)

### 1. Code Quality & Modularity
- **Concerns Separated**: Client-side logic migrated from `index.html` to a modular `app.js` and `styles.css`.
- **Modular Backend**: Routes (Venue, Calendar) and Middleware (Security) isolated for better maintainability.
- **Efficient Lookups**: Optimized zone data access using `Map` objects, improving algorithmic performance from $O(N)$ to $O(1)$ for lookups.
- **Standardized Error Handling**: Global error boundary with structured JSON logging response.

### 2. Security 🔒
- **Helmet Integration**: Secure HTTP headers implemented via `helmet`.
- **Granular Rate Limiting**: Global and per-API route limiters to prevent DoS attacks.
- **Input Validation**: Robust validation using `express-validator` and standard sanitization for all API endpoints.
- **Payload Limits**: Request body size restricted to 10kb.

### 3. Google Services Integration ☁️
- **Gemini AI v1.5 Flash**: Optimized assistant prompt for context-aware stadium navigation and crowd-avoidance recommendations.
- **Maps API**: Dark-themed map with real-time density markers and adaptive zoom.
- **Google Calendar Sync**: Dedicated service for managing event reminders with graceful simulation fallback.
- **Dynamic Logging**: Structured event logging designed for Google Cloud Run/GKE monitoring.

### 4. Accessibility & UI ♿
- **WCAG 2.1 Compliance**: Fully accessible ARIA labels, semantic HTML, and skip-to-content logic.
- **Screen Reader Support**: Integrated `aria-live` announcements for real-time updates and AI assistant responses.
- **Keyboard Navigation**: Enhanced focus management and interactive map accessibility.
- **Premium Aesthetics**: Glassmorphism design system using custom CSS variables and Google Fonts.

### 5. Robust Testing 🧪
- **Comprehensive Coverage**: Unit and integration tests for all API endpoints.
- **Security Testing**: Validation for security headers, payload limits, and error scenarios.

## 🚀 Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Setup**:
   Create a `.env` file from `.env.example`:
   ```env
   PORT=3000
   GEMINI_API_KEY=your_key
   GOOGLE_MAPS_KEY=your_key
   ```

3. **Run in Development**:
   ```bash
   npm run dev
   ```

4. **Run Tests**:
   ```bash
   npm test
   ```

---
*Built for the Google Advanced Agentic Coding Challenge.*
