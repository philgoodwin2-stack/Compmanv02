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
- `DELETE /api/societies/{society_id}` - **Delete society and all data** (Admin only)
- `GET /api/user-societies/{username}` - Get all societies a user belongs to
- `POST /api/switch-society` - Switch to a different society

#### Invite Link Endpoints
- `POST /api/societies/{society_id}/invites` - Create shareable invite link (Admin only)
- `GET /api/societies/{society_id}/invites` - List active invite links (Admin only)
- `GET /api/invites/{code}` - Get invite details (Public)
- `POST /api/invites/{code}/join` - Join society via invite link (Public)
- `DELETE /api/societies/{society_id}/invites/{invite_id}` - Revoke invite link (Admin only)

#### Player & Auth Endpoints
- `/api/login` - Simple username login (creates player if not exists)
- `/api/players` - CRUD for player management with handicap
- `/api/players/{player_id}/toggle-admin` - Toggle admin status (allows first admin)
- `/api/admin-status` - Check if any admins exist in system

#### Competition & Scoring Endpoints
- `GET /api/competitions` - List competitions (filtered by society_id)
- `POST /api/competitions` - Create competition (auto-links to current society)
- `PUT /api/competitions/{id}` - Edit competition (name, description, dates, min_rounds, society_id)
- `DELETE /api/competitions/{id}` - Delete competition
- `/api/competitions/{comp_id}/toggle-round` - Toggle round inclusion in leaderboard
- `/api/rounds` - Round management with course name, tee, slope rating
- `/api/scores` - Simplified total Stableford points entry
- `/api/leaderboard/{competition_id}` - Ranked leaderboard with round details

#### Handicap Endpoints
- `/api/handicap-history` - WHS handicap tracking history with playing handicap
- `/api/players/{player_id}/differentials/{record_idx}/toggle-handicap` - Toggle differential for handicap calc
- `/api/players/{player_id}/import-differentials` - Import comma-separated differentials

### Frontend Pages
- **Login Page**: Streamlined login - returning users go straight to dashboard
- **Dashboard**: Competition overview with stats, Edit Competition dialog (with society selector)
- **Players Page**: Card-based layout with admin controls, handicap history
- **Competition Page**: Tabs for leaderboard, rounds, players
- **Score Entry Page**: Total Stableford points (simplified)
- **Handicap Tracking Page**: Handicap changes history by date
- **Courses Page**: Course management with tees and stroke indices
- **Society Page**: Society management + Society Switcher + **Delete Society** (admin only)
- **Join Invite Page**: `/join/:code` - Public page for joining via invite link

### Features Completed (April 2026)
- ✅ PWA with mobile bottom navigation (Safari-compatible flex layout)
- ✅ Admin role system with first-admin bootstrap
- ✅ Card-based Players page for mobile
- ✅ Native HTML buttons for better Safari touch support
- ✅ Import differentials functionality
- ✅ Handicap history with WHS calculations
- ✅ "The Open Championship" style leaderboard with dropped rounds
- ✅ Multi-tenant Society Architecture (data isolated by society_id)
- ✅ Society Management UI for admins
- ✅ Shareable Invite Links (customizable expiration 1-30 days)
- ✅ Edit Competition (name, description, dates, min_rounds)
- ✅ Streamlined Login - Returning users with society go directly to dashboard
- ✅ Society Switcher - Users in multiple societies can switch between them
- ✅ Competition-Society Linking - Edit dialog has society dropdown
- ✅ **Delete Society** - Admin can permanently delete society and all data (April 10, 2026)

## Delete Society Feature
When an admin deletes a society:
- All competitions (including scores and rounds) are deleted
- All courses are deleted
- All invite links are deleted
- All members are unlinked (accounts remain, society_id set to null)
- The society itself is deleted

## Test Users (Preview Environment)
- `TestAdmin` - Society: "Test Golf Society", Code: NPFUJH (is_admin: true)
- `phil g` - Belongs to 7 societies (can test society switching)
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
