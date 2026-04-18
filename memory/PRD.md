# Golf Stableford Competition App - PRD

## Original Problem Statement
Build an app to capture golf scores and run a competition. It's a stableford comp with multiple rounds and handicap tracking. It should have username access with ability to include/exclude players. Multi-tenant Society system for data isolation by groups.

## Architecture

### Tech Stack
- **Frontend**: React 19 with Tailwind CSS, Shadcn UI components
- **Backend**: FastAPI (Python)
- **Database**: MongoDB (Motor async driver)
- **PWA**: Progressive Web App with manifest, service worker, mobile navigation

### Admin System
- **Society Admin**: Has admin rights within their specific society
- **Global Admin**: Has admin rights across ALL societies (super-admin)

## What's Been Implemented

### Backend Endpoints

#### Society Endpoints
- `POST/GET/PUT/DELETE /api/societies` - Full CRUD for societies
- `DELETE /api/societies/{id}/members/{player_id}` - Remove member (Admin or Global Admin)
- `GET /api/user-societies/{username}` - Get all societies a user belongs to
- `POST /api/switch-society` - Switch to a different society

#### Auth Endpoints
- `/api/login` - Simple username login
- `GET /api/check-username/{username}` - Check if username exists before registration
- `PUT /api/players/{id}/toggle-admin` - Toggle society admin status
- `PUT /api/players/{id}/toggle-global-admin` - Toggle global admin status (Global Admin only)

### Admin Rights

| Action | Society Admin | Global Admin |
|--------|--------------|--------------|
| Edit society details | Own society only | All societies |
| Remove members | Own society only | All societies |
| Delete society | Own society only | All societies |
| Create invite links | Own society only | All societies |
| Revoke invite links | Own society only | All societies |
| Grant society admin | ❌ | ✅ |
| Grant global admin | ❌ | ✅ |

### Features Completed
- ✅ Multi-tenant Society Architecture
- ✅ Society Management UI for admins
- ✅ Shareable Invite Links with custom expiration
- ✅ Society Switcher for multi-society users
- ✅ New User Registration Flow with username availability check
- ✅ **Global Admin System** - Super-admin with rights across all societies
- ✅ **Delete Society** - Admins can delete societies with full cascade deletion (Dec 2025)
- ✅ **WHS Handicap Calculation Fix** - All handicap calculations now use proper WHS adjustments (-2.0 for 1-3 rounds, -1.0 for 4/6 rounds, etc.) (Dec 2025)

## Global Admin Setup
The first global admin can be created via API:
```bash
curl -X PUT "https://yourapp.com/api/players/{player_id}/toggle-global-admin"
```
After the first global admin exists, only global admins can grant global admin status to others.

## Test Users (Preview Environment)
- `TestAdmin` - **Global Admin** + Society: "Test Golf Society"
- `phil g` - Belongs to multiple societies (regular user)

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
