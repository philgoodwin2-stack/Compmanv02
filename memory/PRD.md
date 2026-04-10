# Golf Stableford Competition App - PRD

## Original Problem Statement
Build an app to capture golf scores and run a competition. It's a stableford comp with multiple rounds and handicap tracking. It should have username access with ability to include/exclude players. Multi-tenant Society system for data isolation by groups.

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
- Admin role system for protected operations (per-society)
- Multi-tenant architecture with `society_id` isolation
- First-admin setup: if no admins exist, any user can become admin

## What's Been Implemented

### Backend Endpoints

#### Society Endpoints
- `POST /api/societies` - Create a new society
- `GET /api/societies` - List all societies
- `GET /api/societies/{society_id}` - Get society details
- `GET /api/societies/code/{join_code}` - Lookup society by join code
- `POST /api/societies/{society_id}/join` - Join a society with code
- `PUT /api/societies/{society_id}` - Update society name, regenerate join code (Admin only)
- `PUT /api/societies/{society_id}/admin/{player_id}` - Transfer admin rights (Admin only)
- `DELETE /api/societies/{society_id}/members/{player_id}` - Remove member (Admin only)

#### Player & Auth Endpoints
- `/api/login` - Simple username login (creates player if not exists)
- `/api/players` - CRUD for player management with handicap
- `/api/players/{player_id}/toggle-admin` - Toggle admin status (allows first admin)
- `/api/admin-status` - Check if any admins exist in system

#### Competition & Scoring Endpoints
- `/api/competitions` - CRUD for competitions with start/end dates, min_rounds
- `/api/competitions/{comp_id}/toggle-round` - Toggle round inclusion in leaderboard
- `/api/rounds` - Round management with course name, tee, slope rating
- `/api/scores` - Simplified total Stableford points entry
- `/api/leaderboard/{competition_id}` - Ranked leaderboard with round details

#### Handicap Endpoints
- `/api/handicap-history` - WHS handicap tracking history with playing handicap
- `/api/players/{player_id}/differentials/{record_idx}/toggle-handicap` - Toggle differential for handicap calc
- `/api/players/{player_id}/import-differentials` - Import comma-separated differentials

### Frontend Pages
- **Login Page**: Username entry with society join/create flow
- **Dashboard**: Competition overview with stats, responsive header
- **Players Page**: Card-based layout with admin controls, handicap history
- **Competition Page**: Tabs for leaderboard, rounds, players
- **Score Entry Page**: Total Stableford points (simplified)
- **Handicap Tracking Page**: Handicap changes history by date
- **Courses Page**: Course management with tees and stroke indices
- **Society Page**: Society management for admins (edit name, regenerate code, transfer admin, remove members)

### Features Completed (April 2026)
- ✅ PWA with mobile bottom navigation (Safari-compatible flex layout)
- ✅ Admin role system with first-admin bootstrap
- ✅ Card-based Players page for mobile
- ✅ Native HTML buttons for better Safari touch support
- ✅ Import differentials functionality
- ✅ Handicap history with WHS calculations
- ✅ "The Open Championship" style leaderboard with dropped rounds
- ✅ Multi-tenant Society Architecture (data isolated by society_id)
- ✅ Society Management UI for admins (TESTED - April 10, 2026)

## First-Time Setup (Production)
When deploying to production with an empty database:
1. Log in with any username (creates new player)
2. Create a new society or join existing one with code
3. First member of a society becomes admin automatically
4. Admin can manage society settings, members, and data

## Test Users (Preview Environment)
- `TestAdmin` - Society: "Test Golf Society", Code: NPFUJH (is_admin: true)
- `phil g` - Multiple instances with different societies
- See `/app/memory/test_credentials.md` for full list

## Next Tasks (Prioritized)
### P1 - High Priority
1. Stripe $1 Payment Integration (awaiting user instruction)
2. Refactor bloated files (`server.py`, `CompetitionPage.jsx`, `PlayersPage.jsx` >1000 lines)

### P2 - Medium Priority
3. Bulk import tool with correct course data mapping (Par, Slope, Rating)
4. Export Leaderboard/Stats to CSV/PDF

### P3 - Future/Backlog
5. Match play scoring format
6. Team competitions
