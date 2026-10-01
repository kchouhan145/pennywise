# Pennywise Expense Tracker

A minimal, calm expense tracker built with Node.js, Express, EJS, and MongoDB.

## Setup

1. Install Node.js 20 or newer and MongoDB.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env`, set a unique `SESSION_SECRET`, and confirm `MONGODB_URI`.
4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open http://localhost:3000.

The app uses MongoDB-backed sessions, Helmet security headers, CSRF protection for every POST form, and rate limiting on login and registration.

## Tests and linting

```bash
npm test
npm run lint
```

## Account and data controls

The Settings page supports currency, theme, and monthly trip inclusion preferences. Categories can be added, renamed, recolored, and have their icons edited; deleting a custom category reassigns its expenses to `Other`. Trips can be deleted from the Trips list or detail page, which also removes their expenses. Account deletion removes the signed-in user and all related data.

## Authentication

Visit `/auth/register` to create an account. Sessions are stored in MongoDB and last for seven days. The home dashboard is protected and redirects logged-out visitors to `/auth/login`.
