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

## What's Been Implemented

### Backend Endpoints

#### Society Endpoints
- `POST /api/societies` - Create a new society
- `GET /api/societies` - List all societies
- `GET /api/societies/{society_id}` - Get society details
- `DELETE /api/societies/{society_id}` - Delete society and all data (Admin only)
- `GET /api/user-societies/{username}` - Get all societies a user belongs to
- `POST /api/switch-society` - Switch to a different society

#### Auth Endpoints
- `/api/login` - Simple username login (creates player if not exists)
- `GET /api/check-username/{username}` - **Check if username exists before registration**
- `/api/admin-status` - Check if any admins exist in system

#### Competition & Scoring Endpoints
- `GET/POST /api/competitions` - List/create competitions
- `PUT /api/competitions/{id}` - Edit competition (incl. society_id assignment)
- `DELETE /api/competitions/{id}` - Delete competition

### Frontend Pages
- **Login Page**: Two-flow system - "Sign In" for returning users, "I'm a New Player" for new users
- **Dashboard**: Competition overview with Edit dialog (society selector)
- **Society Page**: Society management + Society Switcher + Delete Society

### Features Completed (April 2026)
- ✅ Multi-tenant Society Architecture
- ✅ Society Management UI for admins
- ✅ Shareable Invite Links
- ✅ Society Switcher for multi-society users
- ✅ Competition-Society Linking via Edit dialog
- ✅ Delete Society feature
- ✅ **New User Registration Flow** - Check username availability before asking for society (April 15, 2026)

## Login Flow

### Returning User (Sign In)
1. Enter name → Click "Sign In"
2. If user exists with society → Direct to dashboard
3. If user exists without society → Show Join/Create options

### New User (I'm a New Player)
1. Click "I'm a New Player"
2. Enter desired name → Click "Continue"
3. **System checks if name is taken:**
   - If taken (has society) → Error: "This name is already taken"
   - If taken (no society) → "Account found! Please join or create a society"
   - If available → "Name available! Now join or create a society"
4. User joins existing society with code OR creates new society

## Test Users (Preview Environment)
- `TestAdmin` - Society: "Test Golf Society" (is_admin: true)
- `phil g` - Belongs to multiple societies

## Next Tasks (Prioritized)
### P1 - High Priority
1. Stripe $1 Payment Integration (awaiting user instruction)
2. Refactor bloated files

### P2 - Medium Priority
3. Bulk import tool with course data mapping
4. Export Leaderboard/Stats to CSV/PDF

### P3 - Future/Backlog
5. Match play scoring format
6. Team competitions
