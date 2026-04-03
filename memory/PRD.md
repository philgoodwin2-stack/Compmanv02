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

## User Personas
1. **Competition Organizer**: Creates competitions, manages players, tracks rounds
2. **Golf Player**: Enters scores, views leaderboard, tracks handicap

## Core Requirements (Static)
- Stableford scoring system
- Multiple rounds per competition
- Handicap tracking per player
- Include/exclude players from competitions
- Simple username-based access

## What's Been Implemented

### Backend Endpoints
- `/api/login` - Simple username login (creates player if not exists)
- `/api/players` - CRUD for player management with handicap
- `/api/players/{player_id}/toggle-admin` - Toggle admin status
- `/api/competitions` - CRUD for competitions with start/end dates, min_rounds
- `/api/competitions/{comp_id}/toggle-round` - Toggle round inclusion in leaderboard
- `/api/rounds` - Round management with course name, tee, slope rating
- `/api/scores` - Simplified total Stableford points entry
- `/api/leaderboard/{competition_id}` - Ranked leaderboard with round details
- `/api/handicap-history` - WHS handicap tracking history with playing handicap
- `/api/players/{player_id}/differentials/{record_idx}/toggle-handicap` - Toggle differential for handicap calc

### Frontend Pages
- **Login Page**: Username entry with auto player creation
- **Dashboard**: Competition overview with stats, responsive header
- **Players Page**: Manage players, handicaps, admin controls, 120+ team logos
- **Competition Page**: Tabs for leaderboard, rounds, players
- **Score Entry Page**: Total Stableford points (simplified)
- **Handicap Tracking Page**: Handicap changes history by date
- **Courses Page**: Course management with tees and stroke indices

### Features Completed (April 2026)
- ✅ Stableford points calculation based on handicap strokes
- ✅ 9 or 18 hole competitions with start/end dates
- ✅ Competition status (upcoming → active → completed)
- ✅ Course Management with Stroke Index
- ✅ Course linking to rounds
- ✅ Import score differentials
- ✅ Leaderboard toggle view (Simple/Detailed)
- ✅ Share leaderboard functionality
- ✅ Handicap progression spreadsheet
- ✅ Playing Handicap column in Handicap History
- ✅ WHS handicap tracking and history
- ✅ 120+ sports team logos for players
- ✅ Admin role system (`is_admin` flag on Player model)
- ✅ Protected routes for Course management and Differential edits
- ✅ Admin management UI (grant/revoke via shield icon)
- ✅ PWA conversion (manifest, service workers, icons)
- ✅ Mobile bottom navigation bar (MobileNav component)
- ✅ "The Open Championship" style leaderboard (gold rows, red leader stars)
- ✅ Round toggle: Include/Exclude from Competition Leaderboard
- ✅ Round toggle: Include/Exclude from Handicap Calculation
- ✅ Responsive mobile layout fixes (headers, card-style players table)

## Prioritized Backlog

### P0 (Done)
- ✅ User login with username
- ✅ Player CRUD with handicap
- ✅ Competition creation and management
- ✅ Round management
- ✅ Score entry with Stableford calculation
- ✅ Leaderboard
- ✅ Mobile-responsive PWA
- ✅ Admin role system

### P1 (Next)
- Refactor bloated files (server.py, CompetitionPage.jsx, PlayersPage.jsx >1000 lines)
- Stripe $1 payment integration (ON HOLD per user request)
- Bulk import tool with course data mapping (Par, Slope, Rating)
- Export scores to CSV/PDF

### P2 (Enhancement)
- Multiple scoring formats (match play, stroke play)
- Team competitions
- Player performance history/statistics

## Admin Credentials
- Username: "PhilG" or "phil g" (both have `is_admin: True`)

## Next Tasks
1. Wait for user instructions on Stripe payment flow
2. Refactor large files into smaller components
3. Add bulk import functionality
4. Export functionality for competition results
