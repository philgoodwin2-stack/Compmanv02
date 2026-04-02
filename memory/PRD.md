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

## What's Been Implemented

### Backend Endpoints
- `/api/login` - Simple username login (creates player if not exists)
- `/api/players` - CRUD for player management with handicap
- `/api/competitions` - CRUD for competitions with start/end dates, min_rounds
- `/api/rounds` - Round management with course name, tee, slope rating
- `/api/scores` - Simplified total Stableford points entry
- `/api/leaderboard/{competition_id}` - Ranked leaderboard with round details
- `/api/handicap-history` - WHS handicap tracking history

### Frontend Pages
- **Login Page**: Username entry with auto player creation
- **Dashboard**: Competition overview with stats
- **Players Page**: Manage players, handicaps, 120+ team logos
- **Competition Page**: Tabs for leaderboard, rounds, players
- **Score Entry Page**: Total Stableford points (simplified)
- **Handicap Tracking Page**: Handicap changes history by date

### Features
- Stableford points calculation based on handicap strokes
- 9 or 18 hole competitions with start/end dates
- Competition status (upcoming → active → completed)
- **Leaderboard toggle view** - Switch between Simple (mobile-friendly) and Detailed (spreadsheet) views
- Spreadsheet-style leaderboard with color-coded scores (April 2026)
- Round dates as columns with tee info
- Custom delete dialogs (replaced browser popups)
- WHS handicap tracking and history
- 120+ sports team logos for players
- Responsive design for mobile

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
