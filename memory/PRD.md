# Golf Stableford Competition App - PRD

## Original Problem Statement
Build an app to capture golf scores and run a competition. It's a stableford comp with multiple rounds and handicap tracking. It should have username access with ability to include/exclude players.

## Architecture

### Tech Stack
- **Frontend**: React 19 with Tailwind CSS, Shadcn UI components
- **Backend**: FastAPI (Python)
- **Database**: MongoDB (Motor async driver)

### Key Components
- User session via localStorage (simple username entry)
- REST API with `/api` prefix for all endpoints
- Stableford scoring calculation based on handicap

## User Personas
1. **Competition Organizer**: Creates competitions, manages players, tracks rounds
2. **Golf Player**: Enters scores, views leaderboard, tracks handicap

## Core Requirements (Static)
- Stableford scoring system
- Multiple rounds per competition
- Handicap tracking per player
- Include/exclude players from competitions
- Simple username-based access

## What's Been Implemented (January 2026)

### Backend Endpoints
- `/api/login` - Simple username login (creates player if not exists)
- `/api/players` - CRUD for player management with handicap
- `/api/competitions` - CRUD for competitions
- `/api/rounds` - Round management within competitions
- `/api/scores` - Score entry with Stableford calculation
- `/api/leaderboard/{competition_id}` - Ranked leaderboard

### Frontend Pages
- **Login Page**: Username entry with auto player creation
- **Dashboard**: Competition overview with stats
- **Players Page**: Manage players, handicaps, active status
- **Competition Page**: Tabs for leaderboard, rounds, players
- **Score Entry Page**: Mobile-friendly hole-by-hole input

### Features
- Stableford points calculation based on handicap strokes
- 9 or 18 hole competitions
- Competition status (upcoming → active → completed)
- Visual score indicators (birdie, par, bogey, etc.)
- Responsive design for mobile score entry

## Prioritized Backlog

### P0 (Done)
- ✅ User login with username
- ✅ Player CRUD with handicap
- ✅ Competition creation and management
- ✅ Round management
- ✅ Score entry with Stableford calculation
- ✅ Leaderboard

### P1 (Future)
- Course stroke index for accurate handicap distribution
- Export scores to CSV/PDF
- Player statistics and history
- Round-by-round breakdown on leaderboard

### P2 (Enhancement)
- Multiple scoring formats (match play, stroke play)
- Team competitions
- Mobile PWA for offline score entry
- Social sharing of results

## Next Tasks
1. Add stroke index per course for accurate handicap distribution
2. Player performance history/statistics
3. Export functionality for competition results
