# Golf Stableford Competition App - PRD

## Original Problem Statement
Build an app to capture golf scores and run a competition. It's a stableford comp with multiple rounds and handicap tracking. It should have username access with ability to include/exclude players.

## Architecture

### Tech Stack
- **Frontend**: React 19 with Tailwind CSS, Shadcn UI components
- **Backend**: FastAPI (Python)
- **Database**: MongoDB (Motor async driver)
- **PWA**: Progressive Web App with manifest, service worker, mobile navigation

### Key Components
- User session via localStorage (simple username entry)
- REST API with `/api` prefix for all endpoints
- Stableford scoring calculation based on handicap
- Admin role system for protected operations
- First-admin setup: if no admins exist, any user can become admin

## What's Been Implemented

### Backend Endpoints
- `/api/login` - Simple username login (creates player if not exists)
- `/api/players` - CRUD for player management with handicap
- `/api/players/{player_id}/toggle-admin` - Toggle admin status (allows first admin)
- `/api/admin-status` - Check if any admins exist in system
- `/api/competitions` - CRUD for competitions with start/end dates, min_rounds
- `/api/competitions/{comp_id}/toggle-round` - Toggle round inclusion in leaderboard
- `/api/rounds` - Round management with course name, tee, slope rating
- `/api/scores` - Simplified total Stableford points entry
- `/api/leaderboard/{competition_id}` - Ranked leaderboard with round details
- `/api/handicap-history` - WHS handicap tracking history with playing handicap
- `/api/players/{player_id}/differentials/{record_idx}/toggle-handicap` - Toggle differential for handicap calc
- `/api/players/{player_id}/import-differentials` - Import comma-separated differentials

### Frontend Pages
- **Login Page**: Username entry with auto player creation
- **Dashboard**: Competition overview with stats, responsive header
- **Players Page**: Card-based layout with admin controls, handicap history
- **Competition Page**: Tabs for leaderboard, rounds, players
- **Score Entry Page**: Total Stableford points (simplified)
- **Handicap Tracking Page**: Handicap changes history by date
- **Courses Page**: Course management with tees and stroke indices

### Features Completed (April 2026)
- ✅ PWA with mobile bottom navigation (Safari-compatible flex layout)
- ✅ Admin role system with first-admin bootstrap
- ✅ Card-based Players page for mobile
- ✅ Native HTML buttons for better Safari touch support
- ✅ Import differentials functionality
- ✅ Handicap history with WHS calculations
- ✅ "The Open Championship" style leaderboard

## First-Time Setup (Production)
When deploying to production with an empty database:
1. Log in with any username (creates new player)
2. Go to Players page
3. Admin controls visible (because no admins exist)
4. Tap "Admin" on yourself to become first admin
5. After that, only admins can grant admin access

## Admin Users (Preview Environment)
- `phil g`, `Phil g`, `Phil G`, `Phil` - all have admin access

## Next Tasks
1. Wait for user instructions on Stripe payment flow
2. Optimize N+1 queries in leaderboard endpoint
3. Add bulk import functionality
4. Export functionality for competition results
