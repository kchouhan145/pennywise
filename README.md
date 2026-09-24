# Pennywise Expense Tracker

A minimal, calm expense tracker built with Node.js, Express, EJS, and MongoDB.

## Phase 1 setup

1. Install Node.js 20 or newer and MongoDB.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` and set `MONGODB_URI`.
4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open http://localhost:3000.

The `/health` endpoint returns the service status without rendering a view.

## Phase 2 authentication

Visit `/auth/register` to create an account. Sessions are stored in MongoDB and last for seven days. The home dashboard is protected and redirects logged-out visitors to `/auth/login`.
