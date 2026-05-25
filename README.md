# Womb Care Early Access Backend

A production-ready Node.js backend using Express, TypeScript, Zod, and Supabase for handling early access registrations.

## Prerequisites
- Node.js (v18+)
- npm or yarn

## Setup
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in your Supabase credentials, SMTP server, and a secure Admin API key.
   ```bash
   cp .env.example .env
   ```

## Development
Run the development server with hot-reload:
```bash
npm run dev
```

## Production
Build and run the production server:
```bash
npm run build
npm start
```

---

## Testing Scenarios

### 1. Simple Health Check
```bash
curl -X GET http://localhost:3000/api/health
```

### 2. Early Access Registration form
This creates a new user, saves them to Supabase, and triggers the confirmation email worker (asynchronously).

```bash
curl -X POST http://localhost:3000/api/early-access \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "+1234567890",
    "age": 28,
    "weight": 65,
    "cycleRegularity": "Regular",
    "symptoms": "Occasional cramps",
    "country": "US",
    "source": "Instagram"
  }'
```

### 3. Check Admin Stats (Secured with API Key)
Ensure `x-admin-api-key` header matches what is defined in your `.env` for `ADMIN_API_KEY`:

```bash
curl -X GET http://localhost:3000/api/admin/stats \\
  -H "x-admin-api-key: your_secure_randomly_generated_api_key"
```

### 4. Fetch Paginated Users (Admin Route)
```bash
curl -X GET "http://localhost:3000/api/admin/users?page=1&limit=10" \\
  -H "x-admin-api-key: your_secure_randomly_generated_api_key"
```

---

## Production Best Practices Implemented

1. **Clean Architecture / Adapter Pattern**:
   The business logic (`earlyAccessService.ts`) is completely unaware of Supabase. It only interacts with a `UserRepository` interface. This allows developers to easily replace Supabase with PostgreSQL or MongoDB by simply writing a new implementation of `DatabaseAdapter`.
2. **Generic Error Handler Middleware**:
   Uncaught errors are normalized and consistently delivered to the client without leaking technical details in production. Validation errors are standardized into a 400 Bad Request status.
3. **Environment Configuration via Zod**:
   The application validates that it possesses all required variables immediately upon startup inside `src/config/env.ts` preventing runtime failures deep in the application due to missing secrets.
4. **Resiliency via Graceful Shutdown**:
   When receiving SIGTERM (such as during a Kubernetes downscale or a Docker restart), the server correctly drains connections before terminating.
5. **Security Implementations**:
   - Uses `helmet` for various HTTP headers.
   - Restricts `cors` origins based on environment settings.
   - Requires API Keys for admin functionalities ensuring strict authorization.
   - Utilizes Rate Limiter strictly on the registration endpoint limiting brute-force & denial of service.
   - Employs strict payloads parameter validation via `zod`.
6. **Logging with Winston**:
   Standardized `winston` logging records errors, operational traces, and allows multiple transports.
