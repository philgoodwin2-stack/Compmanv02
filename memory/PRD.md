# Golf Stableford Competition App - PRD

## Overview
A PWA for capturing golf scores and running Stableford competitions with WHS handicap tracking.

## Tech Stack
- **Frontend**: React, Tailwind CSS, Shadcn UI
- **Backend**: FastAPI, MongoDB (local instance)
- **Features**: PWA, Mobile-first responsive design, Multi-tenant Architecture

## Core Features
- Stableford points scoring
- Multiple rounds/tournaments
- WHS handicap tracking (truncation-based calculation)
- Username-based access
- Player include/exclude management
- Masters-style leaderboard with scores by date
- Multi-tenant Society system (data isolated by groups)
- Global Admin RBAC system

## Key DB Schema
- `societies`: {id, name, join_code, admin_id, created_at}
- `players`: {id, username, handicap, active, is_admin, is_global_admin, society_id, handicap_history}
- `courses`: {id, name, tees, holes, society_id}
- `competitions`: {id, name, start_date, end_date, min_rounds, society_id}
- `rounds`: {id, date, course_id, competition_id}
- `scores`: {id, round_id, player_id, total_gross, playing_handicap, score_differential, is_included_in_comp, is_included_in_handicap, holes}

## Features Completed
- ✅ Multi-tenant Society Architecture
- ✅ Global Admin System
- ✅ Delete Society with cascade deletion
- ✅ WHS Handicap Calculation (truncation-based)
- ✅ Score Metadata Editor
- ✅ Show All Players (Global Admin view)
- ✅ Add Player to Society
- ✅ Move Player Between Societies
- ✅ Society Badge on Competition
- ✅ Delete Round Cascade (removes WHS history)
- ✅ Delete Player Score from Round
- ✅ Player-Level Comp/HCP Toggles
- ✅ Simplified Handicap Tracking Page with Playing HCP Calculator
- ✅ Masters-Style Leaderboard with scores by date columns
- ✅ Spreadsheet view toggle on Handicap page

## Upcoming Tasks
- P1: Stripe $1 Payment Integration (awaiting instruction)
- P1: Refactor bloated files (server.py ~2400 lines)
- P2: Bulk import tool with course data mapping
- P2: Export Leaderboard/Stats to CSV/PDF

## Future/Backlog
- P3: Match play scoring format
- P3: Team competitions

## Test Credentials
- Username: TestAdmin (is_global_admin: true)
- Username: Nathan D (regular player)
