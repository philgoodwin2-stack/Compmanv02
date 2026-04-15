from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import random
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from enum import Enum
from decimal import Decimal, ROUND_HALF_UP

def round_half_up(value: float, decimals: int = 1) -> float:
    """Round using standard rounding (round half up) instead of Python's banker's rounding"""
    d = Decimal(str(value))
    return float(d.quantize(Decimal(10) ** -decimals, rounding=ROUND_HALF_UP))

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ============= MODELS =============

# Society Models
class SocietyBase(BaseModel):
    name: str

class SocietyCreate(SocietyBase):
    pass

class Society(SocietyBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    join_code: str = Field(default_factory=lambda: ''.join(random.choices('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', k=6)))
    admin_id: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# Invite Link Models
class InviteCreate(BaseModel):
    expires_in_days: int = 7  # Default 7 days

class InviteLink(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    society_id: str
    code: str = Field(default_factory=lambda: ''.join(random.choices('abcdefghjkmnpqrstuvwxyz23456789', k=8)))
    created_by: str  # Admin player_id
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    expires_at: str  # ISO datetime string
    is_active: bool = True

class PlayerBase(BaseModel):
    username: str
    handicap: float = 18.0
    is_active: bool = True
    is_admin: bool = False
    team_logo: str = ""
    society_id: Optional[str] = None

class PlayerCreate(PlayerBase):
    pass

class PlayerUpdate(BaseModel):
    username: Optional[str] = None
    handicap: Optional[float] = None
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None
    team_logo: Optional[str] = None
    society_id: Optional[str] = None

class HandicapRecord(BaseModel):
    date: str
    round_id: str
    course_name: str
    score: int  # Stableford points
    course_rating: float = 72.0
    slope_rating: int = 113
    par: int = 72
    playing_handicap: Optional[int] = None
    gross_score: Optional[int] = None
    score_differential: float
    handicap_before: float
    handicap_after: float

class Player(PlayerBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    handicap_history: List[HandicapRecord] = []

class CompetitionStatus(str, Enum):
    UPCOMING = "upcoming"
    ACTIVE = "active"
    COMPLETED = "completed"

class CompetitionBase(BaseModel):
    name: str
    description: Optional[str] = ""
    num_holes: int = 18
    status: CompetitionStatus = CompetitionStatus.UPCOMING
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    min_rounds: int = 13
    society_id: Optional[str] = None

class CompetitionCreate(CompetitionBase):
    pass

class CompetitionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[CompetitionStatus] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    min_rounds: Optional[int] = None
    society_id: Optional[str] = None

class Competition(CompetitionBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    player_ids: List[str] = []
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    min_rounds: int = 13
    society_id: Optional[str] = None

class RoundBase(BaseModel):
    competition_id: str
    round_number: int
    name: Optional[str] = ""
    date: Optional[str] = None
    course_name: Optional[str] = ""
    course_id: Optional[str] = None  # Reference to a Course with stroke indices
    tee: Optional[str] = ""
    slope_rating: Optional[int] = 113
    course_rating: Optional[float] = 72.0  # Course Rating for differential calculation
    course_par: int = 72
    is_included: bool = True  # Whether this round counts towards competition
    counts_for_handicap: bool = True  # Whether this round counts towards handicap calculation

class RoundCreate(RoundBase):
    pass

class Round(RoundBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class HoleScore(BaseModel):
    hole_number: int
    par: int = 4
    strokes: int
    stableford_points: int = 0

class ScoreBase(BaseModel):
    round_id: str
    player_id: str
    player_handicap: float
    holes: List[HoleScore] = []
    total_strokes: int = 0
    total_stableford: int = 0

class ScoreCreate(BaseModel):
    round_id: str
    player_id: str

class ScoreUpdate(BaseModel):
    holes: Optional[List[HoleScore]] = None

class ScorePointsUpdate(BaseModel):
    total_stableford: int
    playing_handicap: Optional[int] = None  # Shots received (if different from calculated)

class Score(ScoreBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class LeaderboardEntry(BaseModel):
    player_id: str
    player_username: str
    player_handicap: float
    player_team_logo: str = ""
    rounds_played: int
    total_stableford: int
    counting_total: int = 0  # Total of only counting rounds
    average_stableford: float = 0.0
    round_scores: List[int] = []
    dropped_rounds: List[int] = []  # Indices of dropped rounds (0-based)
    qualified: bool = False

# Course Models
class HoleInfo(BaseModel):
    hole_number: int
    par: int = 4
    stroke_index: int  # 1-18, where 1 is hardest hole
    yards: Optional[int] = None

class CourseBase(BaseModel):
    name: str
    tee: str = "White"  # e.g., White, Yellow, Red, Blue
    slope_rating: int = 113
    course_rating: float = 72.0
    total_par: int = 72
    holes: List[HoleInfo] = []
    society_id: Optional[str] = None

class CourseCreate(CourseBase):
    pass

class CourseUpdate(BaseModel):
    name: Optional[str] = None
    tee: Optional[str] = None
    slope_rating: Optional[int] = None
    course_rating: Optional[float] = None
    total_par: Optional[int] = None
    holes: Optional[List[HoleInfo]] = None

class Course(CourseBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    society_id: Optional[str] = None


# ============= ADMIN CHECK HELPER =============

async def check_admin(user_id: str) -> bool:
    """Check if a user is an admin"""
    player = await db.players.find_one({"id": user_id})
    if not player:
        return False
    return player.get("is_admin", False)

async def require_admin(user_id: str):
    """Raise exception if user is not admin"""
    if not await check_admin(user_id):
        raise HTTPException(status_code=403, detail="Admin access required")

# ============= SOCIETY ENDPOINTS =============

@api_router.post("/societies", response_model=Society)
async def create_society(society_data: SocietyCreate, creator_username: str = None):
    """Create a new society. The creator becomes the admin."""
    society = Society(**society_data.model_dump())
    
    await db.societies.insert_one(society.model_dump())
    
    return society

@api_router.get("/societies", response_model=List[Society])
async def get_societies():
    """Get all societies (for admin purposes)"""
    societies = await db.societies.find({}, {"_id": 0}).to_list(1000)
    return societies

@api_router.get("/societies/{society_id}", response_model=Society)
async def get_society(society_id: str):
    """Get a specific society by ID"""
    society = await db.societies.find_one({"id": society_id}, {"_id": 0})
    if not society:
        raise HTTPException(status_code=404, detail="Society not found")
    return society

@api_router.get("/societies/code/{join_code}")
async def get_society_by_code(join_code: str):
    """Get a society by its join code"""
    society = await db.societies.find_one({"join_code": join_code.upper()}, {"_id": 0})
    if not society:
        raise HTTPException(status_code=404, detail="Society not found with that code")
    return society

@api_router.post("/societies/{society_id}/join")
async def join_society(society_id: str, player_id: str):
    """Join a society as a player"""
    society = await db.societies.find_one({"id": society_id}, {"_id": 0})
    if not society:
        raise HTTPException(status_code=404, detail="Society not found")
    
    # Update player's society_id
    result = await db.players.update_one(
        {"id": player_id},
        {"$set": {"society_id": society_id}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Player not found")
    
    # Check if this is the first player in the society - make them admin
    player_count = await db.players.count_documents({"society_id": society_id})
    if player_count == 1:
        # First player becomes society admin
        await db.players.update_one(
            {"id": player_id},
            {"$set": {"is_admin": True}}
        )
        await db.societies.update_one(
            {"id": society_id},
            {"$set": {"admin_id": player_id}}
        )
        return {"message": "Joined society and became admin (first member)", "is_admin": True}
    
    return {"message": "Joined society successfully", "is_admin": False}

@api_router.put("/societies/{society_id}/admin/{player_id}")
async def set_society_admin(society_id: str, player_id: str, current_admin_id: str = None):
    """Set a new admin for the society (current admin only)"""
    society = await db.societies.find_one({"id": society_id}, {"_id": 0})
    if not society:
        raise HTTPException(status_code=404, detail="Society not found")
    
    # Verify current user is admin (if provided)
    if current_admin_id and society.get("admin_id") != current_admin_id:
        raise HTTPException(status_code=403, detail="Only current admin can change admin")
    
    # Remove admin from old admin
    if society.get("admin_id"):
        await db.players.update_one(
            {"id": society["admin_id"]},
            {"$set": {"is_admin": False}}
        )
    
    # Set new admin
    await db.players.update_one(
        {"id": player_id},
        {"$set": {"is_admin": True}}
    )
    await db.societies.update_one(
        {"id": society_id},
        {"$set": {"admin_id": player_id}}
    )
    
    return {"message": "Admin changed successfully"}

class SocietyUpdate(BaseModel):
    name: Optional[str] = None
    regenerate_code: Optional[bool] = False

@api_router.put("/societies/{society_id}")
async def update_society(society_id: str, update_data: SocietyUpdate, admin_id: str = None):
    """Update society details (Admin only)"""
    society = await db.societies.find_one({"id": society_id}, {"_id": 0})
    if not society:
        raise HTTPException(status_code=404, detail="Society not found")
    
    # Verify admin
    if admin_id and society.get("admin_id") != admin_id:
        raise HTTPException(status_code=403, detail="Only admin can update society details")
    
    update_fields = {}
    
    if update_data.name:
        update_fields["name"] = update_data.name
    
    if update_data.regenerate_code:
        # Generate new join code
        new_code = ''.join(random.choices('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', k=6))
        update_fields["join_code"] = new_code
    
    if update_fields:
        await db.societies.update_one(
            {"id": society_id},
            {"$set": update_fields}
        )
    
    # Return updated society
    updated = await db.societies.find_one({"id": society_id}, {"_id": 0})
    return updated

@api_router.delete("/societies/{society_id}/members/{player_id}")
async def remove_member(society_id: str, player_id: str, admin_id: str = None):
    """Remove a member from the society (Admin only)"""
    society = await db.societies.find_one({"id": society_id}, {"_id": 0})
    if not society:
        raise HTTPException(status_code=404, detail="Society not found")
    
    # Verify admin
    if admin_id and society.get("admin_id") != admin_id:
        raise HTTPException(status_code=403, detail="Only admin can remove members")
    
    # Can't remove admin
    if player_id == society.get("admin_id"):
        raise HTTPException(status_code=400, detail="Cannot remove admin. Transfer admin first.")
    
    # Remove player from society
    await db.players.update_one(
        {"id": player_id},
        {"$set": {"society_id": None}}
    )
    
    return {"message": "Member removed successfully"}

@api_router.delete("/societies/{society_id}")
async def delete_society(society_id: str, admin_id: str = None):
    """Delete a society and all associated data (Admin only)"""
    society = await db.societies.find_one({"id": society_id}, {"_id": 0})
    if not society:
        raise HTTPException(status_code=404, detail="Society not found")
    
    # Verify admin
    if admin_id and society.get("admin_id") != admin_id:
        raise HTTPException(status_code=403, detail="Only admin can delete the society")
    
    # Delete all invite links for this society
    await db.invite_links.delete_many({"society_id": society_id})
    
    # Delete all scores for rounds in competitions of this society
    competitions = await db.competitions.find({"society_id": society_id}, {"_id": 0}).to_list(1000)
    comp_ids = [c["id"] for c in competitions]
    
    if comp_ids:
        rounds = await db.rounds.find({"competition_id": {"$in": comp_ids}}, {"_id": 0}).to_list(10000)
        round_ids = [r["id"] for r in rounds]
        
        if round_ids:
            await db.scores.delete_many({"round_id": {"$in": round_ids}})
        
        # Delete all rounds for competitions in this society
        await db.rounds.delete_many({"competition_id": {"$in": comp_ids}})
    
    # Delete all competitions for this society
    await db.competitions.delete_many({"society_id": society_id})
    
    # Delete all courses for this society
    await db.courses.delete_many({"society_id": society_id})
    
    # Remove society_id from all players (don't delete players, just unlink them)
    await db.players.update_many(
        {"society_id": society_id},
        {"$set": {"society_id": None, "is_admin": False}}
    )
    
    # Delete the society itself
    await db.societies.delete_one({"id": society_id})
    
    return {"message": "Society and all associated data deleted successfully"}

# ============= INVITE LINK ENDPOINTS =============

@api_router.post("/societies/{society_id}/invites")
async def create_invite_link(society_id: str, invite_data: InviteCreate, admin_id: str = None):
    """Create a shareable invite link for a society (Admin only)"""
    society = await db.societies.find_one({"id": society_id}, {"_id": 0})
    if not society:
        raise HTTPException(status_code=404, detail="Society not found")
    
    # Verify admin
    if admin_id and society.get("admin_id") != admin_id:
        raise HTTPException(status_code=403, detail="Only admin can create invite links")
    
    # Calculate expiration
    expires_at = datetime.now(timezone.utc) + timedelta(days=invite_data.expires_in_days)
    
    invite = InviteLink(
        society_id=society_id,
        created_by=admin_id or society.get("admin_id"),
        expires_at=expires_at.isoformat()
    )
    
    await db.invite_links.insert_one(invite.model_dump())
    
    return {
        "id": invite.id,
        "code": invite.code,
        "society_id": invite.society_id,
        "society_name": society["name"],
        "expires_at": invite.expires_at,
        "created_at": invite.created_at
    }

@api_router.get("/societies/{society_id}/invites")
async def get_society_invites(society_id: str, admin_id: str = None):
    """Get all active invite links for a society (Admin only)"""
    society = await db.societies.find_one({"id": society_id}, {"_id": 0})
    if not society:
        raise HTTPException(status_code=404, detail="Society not found")
    
    # Verify admin
    if admin_id and society.get("admin_id") != admin_id:
        raise HTTPException(status_code=403, detail="Only admin can view invite links")
    
    now = datetime.now(timezone.utc).isoformat()
    invites = await db.invite_links.find({
        "society_id": society_id,
        "is_active": True,
        "expires_at": {"$gt": now}
    }, {"_id": 0}).to_list(100)
    
    return invites

@api_router.get("/invites/{code}")
async def get_invite_by_code(code: str):
    """Get invite link details by code (Public - for join page)"""
    invite = await db.invite_links.find_one({"code": code, "is_active": True}, {"_id": 0})
    if not invite:
        raise HTTPException(status_code=404, detail="Invite link not found or expired")
    
    # Check expiration
    now = datetime.now(timezone.utc)
    expires_at = datetime.fromisoformat(invite["expires_at"].replace('Z', '+00:00'))
    if now > expires_at:
        raise HTTPException(status_code=410, detail="Invite link has expired")
    
    # Get society details
    society = await db.societies.find_one({"id": invite["society_id"]}, {"_id": 0})
    if not society:
        raise HTTPException(status_code=404, detail="Society not found")
    
    # Count members
    member_count = await db.players.count_documents({"society_id": invite["society_id"]})
    
    return {
        "code": invite["code"],
        "society_id": invite["society_id"],
        "society_name": society["name"],
        "member_count": member_count,
        "expires_at": invite["expires_at"]
    }

@api_router.post("/invites/{code}/join")
async def join_via_invite(code: str, username: str):
    """Join a society using an invite link"""
    invite = await db.invite_links.find_one({"code": code, "is_active": True}, {"_id": 0})
    if not invite:
        raise HTTPException(status_code=404, detail="Invite link not found or expired")
    
    # Check expiration
    now = datetime.now(timezone.utc)
    expires_at = datetime.fromisoformat(invite["expires_at"].replace('Z', '+00:00'))
    if now > expires_at:
        raise HTTPException(status_code=410, detail="Invite link has expired")
    
    society_id = invite["society_id"]
    
    # Check if player exists in this society
    existing = await db.players.find_one({
        "username": username,
        "society_id": society_id
    }, {"_id": 0})
    
    if existing:
        return existing
    
    # Check if player exists without society
    player_without_society = await db.players.find_one({
        "username": username,
        "society_id": None
    }, {"_id": 0})
    
    if player_without_society:
        # Update player to join this society
        await db.players.update_one(
            {"id": player_without_society["id"]},
            {"$set": {"society_id": society_id}}
        )
        player_without_society["society_id"] = society_id
        return player_without_society
    
    # Create new player in this society
    new_player = Player(username=username, society_id=society_id)
    await db.players.insert_one(new_player.model_dump())
    
    return new_player.model_dump()

@api_router.delete("/societies/{society_id}/invites/{invite_id}")
async def revoke_invite(society_id: str, invite_id: str, admin_id: str = None):
    """Revoke an invite link (Admin only)"""
    society = await db.societies.find_one({"id": society_id}, {"_id": 0})
    if not society:
        raise HTTPException(status_code=404, detail="Society not found")
    
    # Verify admin
    if admin_id and society.get("admin_id") != admin_id:
        raise HTTPException(status_code=403, detail="Only admin can revoke invite links")
    
    result = await db.invite_links.update_one(
        {"id": invite_id, "society_id": society_id},
        {"$set": {"is_active": False}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Invite not found")
    
    return {"message": "Invite revoked successfully"}

# ============= HELPER FUNCTIONS =============

def calculate_stableford(strokes: int, par: int, handicap_strokes: int) -> int:
    """Calculate Stableford points for a hole based on net score."""
    net_strokes = strokes - handicap_strokes
    net_score = net_strokes - par
    
    if net_score >= 2:  # Double bogey or worse
        return 0
    elif net_score == 1:  # Bogey
        return 1
    elif net_score == 0:  # Par
        return 2
    elif net_score == -1:  # Birdie
        return 3
    elif net_score == -2:  # Eagle
        return 4
    else:  # Albatross or better
        return 5

def distribute_handicap_strokes(handicap: float, num_holes: int = 18) -> List[int]:
    """Distribute handicap strokes across holes (simplified - even distribution)."""
    full_strokes = int(handicap)
    strokes_per_hole = [full_strokes // num_holes] * num_holes
    remaining = full_strokes % num_holes
    for i in range(remaining):
        strokes_per_hole[i] += 1
    return strokes_per_hole

def calculate_score_differential(stableford_points: int, course_rating: float, slope_rating: int, par: int = 72, handicap_index: float = 18.0, playing_handicap: int = None) -> float:
    """

    Calculate score differential based on World Handicap System.
    For Stableford: Convert points to approximate gross score, then calculate differential.
    
    WHS Formula:
    1. Course Handicap = Handicap Index × (Slope Rating / 113)+72
    2. Playing Handicap = Course Handicap + (Course Rating - Par-45)
    3. 36 points = playing to handicap (par net)
    4. Gross Score = Par + Playing Handicap - (Stableford Points -36)
    5. Differential = (Gross Score - Course Rating) × (113 / Slope Rating)
    """
    # Use provided playing_handicap or calculate it using WHS formula
    if playing_handicap is None:
        # WHS Formula: Course Handicap = Handicap Index × (Slope Rating ÷ 113) + (Course Rating – Par)
        # Calculate in one step, then round to avoid double-rounding errors
        raw_handicap = handicap_index * (slope_rating / 113) + (course_rating - par)
        playing_handicap = int(raw_handicap + 0.5) if raw_handicap >= 0 else int(raw_handicap - 0.5)
    
    # Convert Stableford to approximate gross score
    # 36 points = par net (playing to handicap)
    points_diff = stableford_points - 36
    # Gross score = what the player actually shot
    approx_gross = par + playing_handicap - points_diff

    
    # Score Differential = (Adjusted Gross Score - Course Rating) × (113 / Slope Rating)
    differential = (approx_gross - course_rating) * (113 / slope_rating)
    return round_half_up(differential, 1)

def calculate_handicap_index(differentials: List[float]) -> float:
    """
    Calculate handicap index based on World Handicap System.
    Uses the best differentials from the most recent rounds.
    """
    if not differentials:
        return 18.0  # Default handicap
    
    num_scores = len(differentials)
    
    # WHS table for number of differentials to use
    if num_scores == 1:
        # Use lowest - 2.0 adjustment (per WHS for 1 score)
        best = sorted(differentials)[:1]
        adjustment = -2.0
    elif num_scores == 2:
        best = sorted(differentials)[:1]
        adjustment = -2.0
    elif num_scores == 3:
        best = sorted(differentials)[:1]
        adjustment = -2.0
    elif num_scores == 4:
        best = sorted(differentials)[:1]
        adjustment = -1.0
    elif num_scores == 5:
        best = sorted(differentials)[:1]
        adjustment = 0.0
    elif num_scores == 6:
        best = sorted(differentials)[:2]
        adjustment = -1.0
    elif num_scores in [7, 8]:
        best = sorted(differentials)[:2]
        adjustment = 0.0
    elif num_scores in [9, 10, 11]:
        best = sorted(differentials)[:3]
        adjustment = 0.0
    elif num_scores in [12, 13, 14]:
        best = sorted(differentials)[:4]
        adjustment = 0.0
    elif num_scores in [15, 16]:
        best = sorted(differentials)[:5]
        adjustment = 0.0
    elif num_scores in [17, 18]:
        best = sorted(differentials)[:6]
        adjustment = 0.0
    elif num_scores == 19:
        best = sorted(differentials)[:7]
        adjustment = 0.0
    else:  # 20 or more
        # Use best 8 of last 20
        recent_20 = differentials[-20:]
        best = sorted(recent_20)[:8]
        adjustment = 0.0
    
    avg = sum(best) / len(best) if best else 18.0
    handicap = avg + adjustment
    
    # Cap at 54.0 (max handicap in WHS) and minimum 0.0
    return round_half_up(min(max(handicap, 0.0), 54.0), 1)

# ============= PLAYER ENDPOINTS =============

@api_router.get("/players", response_model=List[Player])
async def get_players(active_only: bool = False, society_id: Optional[str] = None):
    query = {}
    if active_only:
        query["is_active"] = True
    if society_id:
        query["society_id"] = society_id
    players = await db.players.find(query, {"_id": 0}).to_list(1000)
    return players

@api_router.get("/admin-status")
async def get_admin_status(society_id: Optional[str] = None):
    """Check if any admins exist in the system or society"""
    query = {"is_admin": True}
    if society_id:
        query["society_id"] = society_id
    admin_count = await db.players.count_documents(query)
    return {"has_admins": admin_count > 0, "admin_count": admin_count}

@api_router.get("/players/{player_id}", response_model=Player)
async def get_player(player_id: str):
    player = await db.players.find_one({"id": player_id}, {"_id": 0})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return player

@api_router.post("/players", response_model=Player)
async def create_player(player_data: PlayerCreate):
    # Check if username exists
    existing = await db.players.find_one({"username": player_data.username})
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    player = Player(**player_data.model_dump())
    doc = player.model_dump()
    await db.players.insert_one(doc)
    return player

@api_router.put("/players/{player_id}", response_model=Player)
async def update_player(player_id: str, player_data: PlayerUpdate):
    update_dict = {k: v for k, v in player_data.model_dump().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.players.update_one({"id": player_id}, {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Player not found")
    
    player = await db.players.find_one({"id": player_id}, {"_id": 0})
    return player

@api_router.delete("/players/{player_id}")
async def delete_player(player_id: str):
    result = await db.players.delete_one({"id": player_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Player not found")
    return {"message": "Player deleted"}

@api_router.put("/players/{player_id}/toggle-admin")
async def toggle_admin_status(player_id: str, user_id: str = None):
    """Toggle admin status for a player (Admin only, or first admin setup)"""
    # Check if any admins exist
    admin_count = await db.players.count_documents({"is_admin": True})
    
    # If no admins exist, allow anyone to become the first admin
    if admin_count > 0 and user_id:
        await require_admin(user_id)
    
    player = await db.players.find_one({"id": player_id})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    current_status = player.get("is_admin", False)
    new_status = not current_status
    
    await db.players.update_one(
        {"id": player_id},
        {"$set": {"is_admin": new_status}}
    )
    
    return {
        "message": f"{'Granted' if new_status else 'Revoked'} admin access for {player['username']}",
        "is_admin": new_status
    }


@api_router.get("/players/{player_id}/handicap-history")
async def get_player_handicap_history(player_id: str):
    """Get the handicap history for a player with indication of which diffs are used"""
    player = await db.players.find_one({"id": player_id}, {"_id": 0})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    history = player.get("handicap_history", [])
    
    # Calculate which differentials are used in the handicap (best 8 of last 20)
    if history:
        # Get last 20 records sorted by date (most recent first)
        sorted_history = sorted(history, key=lambda x: x.get("date", ""), reverse=True)[:20]
        all_diffs = [(r.get("date"), r.get("score_differential", 0)) for r in sorted_history]
        
        # Sort by differential to find best ones
        sorted_by_diff = sorted(all_diffs, key=lambda x: x[1])
        
        # Number to use based on WHS rules
        num_rounds = len(all_diffs)
        if num_rounds <= 3:
            num_to_use = 1
        elif num_rounds <= 5:
            num_to_use = 1
        elif num_rounds <= 6:
            num_to_use = 2
        elif num_rounds <= 8:
            num_to_use = 2
        elif num_rounds <= 11:
            num_to_use = 3
        elif num_rounds <= 14:
            num_to_use = 4
        elif num_rounds <= 16:
            num_to_use = 5
        elif num_rounds <= 18:
            num_to_use = 6
        elif num_rounds <= 19:
            num_to_use = 7
        else:
            num_to_use = 8
        
        # Get dates of differentials used
        used_dates = set(d[0] for d in sorted_by_diff[:num_to_use])
    else:
        used_dates = set()
        num_to_use = 0
    
    return {
        "player_id": player_id,
        "username": player.get("username"),
        "current_handicap": player.get("handicap", 18.0),
        "history": history,
        "used_dates": list(used_dates),
        "num_counting": num_to_use,
        "total_rounds": len(history)
    }

@api_router.post("/players/{player_id}/recalculate-handicap")
async def recalculate_handicap(player_id: str):
    """Recalculate a player's handicap from their history, updating differentials from round data"""
    player = await db.players.find_one({"id": player_id}, {"_id": 0})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    history = player.get("handicap_history", [])
    
    if not history:
        return {"message": "No history to calculate from", "handicap": player.get("handicap", 18.0)}
    
    # Sort by date and recalculate
    sorted_history = sorted(history, key=lambda x: x.get("date", ""))
    
    # Recalculate each differential using round data where available
    for record in sorted_history:
        round_id = record.get("round_id", "")
        
        # Skip imported records (they start with "imported-")
        if round_id.startswith("imported-"):
            continue
            
        # Look up the round to get correct course_rating
        round_doc = await db.rounds.find_one({"id": round_id}, {"_id": 0})
        if round_doc:
            course_rating = round_doc.get("course_rating", round_doc.get("course_par", 72))
            slope_rating = round_doc.get("slope_rating", 113)
            course_par = round_doc.get("course_par", 72)
            
            # Get the score
            score_doc = await db.scores.find_one({"round_id": round_id, "player_id": player_id}, {"_id": 0})
            if score_doc:
                stableford_pts = score_doc.get("total_stableford", record.get("score", 0))
                
                # Use stored playing_handicap or calculate using WHS formula
                playing_hcp = record.get("playing_handicap")
                if playing_hcp is None:
                    hcp_before = record.get("handicap_before", 18.0)
                    # WHS: Single-step calculation then round
                    raw_hcp = hcp_before * (slope_rating / 113) + (course_rating - course_par)
                    playing_hcp = int(raw_hcp + 0.5) if raw_hcp >= 0 else int(raw_hcp - 0.5)
                
                # Recalculate differential with correct course rating
                new_diff = calculate_score_differential(
                    stableford_pts,
                    course_rating,
                    slope_rating,
                    course_par,
                    record.get("handicap_before", 18.0),
                    playing_hcp
                )
                
                # Calculate gross score
                points_diff = stableford_pts - 36
                gross_score = course_par + playing_hcp - points_diff
                
                # Update record
                record["score_differential"] = new_diff
                record["course_rating"] = course_rating
                record["gross_score"] = gross_score
                record["playing_handicap"] = playing_hcp
                record["score"] = stableford_pts
    
    # Now recalculate handicaps
    for i, record in enumerate(sorted_history):
        available_diffs = [r["score_differential"] for r in sorted_history[:i+1]]
        
        num_rounds = len(available_diffs)
        if num_rounds <= 3:
            num_to_use = 1
        elif num_rounds <= 5:
            num_to_use = 1
        elif num_rounds <= 6:
            num_to_use = 2
        elif num_rounds <= 8:
            num_to_use = 2
        elif num_rounds <= 11:
            num_to_use = 3
        elif num_rounds <= 14:
            num_to_use = 4
        elif num_rounds <= 16:
            num_to_use = 5
        elif num_rounds <= 18:
            num_to_use = 6
        elif num_rounds <= 19:
            num_to_use = 7
        else:
            num_to_use = 8
        
        sorted_diffs = sorted(available_diffs)[:num_to_use]
        avg_diff = sum(sorted_diffs) / len(sorted_diffs)
        new_handicap = round_half_up(avg_diff, 1)
        
        record["handicap_after"] = new_handicap
        if i > 0:
            record["handicap_before"] = sorted_history[i-1]["handicap_after"]
        else:
            record["handicap_before"] = new_handicap
    
    final_handicap = sorted_history[-1]["handicap_after"]
    
    # Update player
    await db.players.update_one(
        {"id": player_id},
        {
            "$set": {
                "handicap": final_handicap,
                "handicap_history": sorted_history
            }
        }
    )
    
    return {
        "message": "Handicap recalculated with updated differentials",
        "new_handicap": final_handicap,
        "rounds_used": len(sorted_history)
    }

class ImportDifferentialsRequest(BaseModel):
    differentials: str  # Comma-delimited string like "8.7,4.5,11.5"

@api_router.post("/players/{player_id}/import-differentials")
async def import_score_differentials(player_id: str, request: ImportDifferentialsRequest, user_id: str = None):
    """Import score differentials from comma-delimited string (Admin only)
    
    Dates are assigned as today-900, today-901, etc. to keep them as historical imports.
    Max 20 differentials.
    """
    if user_id:
        await require_admin(user_id)
    
    player = await db.players.find_one({"id": player_id}, {"_id": 0})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    # Parse the comma-delimited string
    try:
        diff_strings = [s.strip() for s in request.differentials.split(",") if s.strip()]
        differentials = [float(d) for d in diff_strings]
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid format. Use comma-separated numbers like: 8.7,4.5,11.5")
    
    if len(differentials) > 20:
        raise HTTPException(status_code=400, detail="Maximum 20 differentials allowed")
    
    if len(differentials) == 0:
        raise HTTPException(status_code=400, detail="No differentials provided")
    
    # Create handicap history records with dates starting from today-900
    today = datetime.now(timezone.utc).date()
    handicap_history = []
    
    for i, diff in enumerate(differentials):
        # Start from today-900, then today-901, today-902, etc.
        record_date = today - timedelta(days=900 + i)
        
        # Calculate handicap_after for this record based on WHS rules
        # For import, we'll store the differential and calculate running handicap
        handicap_record = {
            "date": record_date.isoformat(),
            "round_id": f"imported-{i+1}",
            "competition_name": "Imported History",
            "course_name": "Historical Round",
            "score": 0,  # Not available for imports
            "slope_rating": 113,
            "score_differential": diff,
            "handicap_before": 0,  # Will be calculated
            "handicap_after": 0,   # Will be calculated
        }
        handicap_history.append(handicap_record)
    
    # Calculate handicaps using WHS rules (best 8 of last 20)
    all_differentials = [r["score_differential"] for r in handicap_history]
    
    for i, record in enumerate(handicap_history):
        # Differentials available up to this point (from latest to this record)
        available_diffs = all_differentials[:i+1]
        
        if len(available_diffs) >= 3:
            # WHS: Best 8 of 20 (or proportional for fewer rounds)
            num_to_use = min(8, max(1, len(available_diffs) // 2))
            sorted_diffs = sorted(available_diffs)[:num_to_use]
            avg_diff = sum(sorted_diffs) / len(sorted_diffs)
            new_handicap = round_half_up(avg_diff, 1)  # WHS: average of best differentials
        else:
            # Not enough rounds, use simple average
            avg_diff = sum(available_diffs) / len(available_diffs)
            new_handicap = round_half_up(avg_diff, 1)
        
        record["handicap_after"] = new_handicap
        if i > 0:
            record["handicap_before"] = handicap_history[i-1]["handicap_after"]
        else:
            record["handicap_before"] = new_handicap
    
    # Final handicap is from the most recent (first) record
    final_handicap = handicap_history[0]["handicap_after"] if handicap_history else player.get("handicap", 18.0)
    
    # Update player with imported history
    await db.players.update_one(
        {"id": player_id},
        {
            "$set": {
                "handicap": final_handicap,
                "handicap_history": handicap_history
            }
        }
    )
    
    return {
        "message": f"Imported {len(differentials)} differentials",
        "new_handicap": final_handicap,
        "records_imported": len(handicap_history)
    }

class UpdateDifferentialRequest(BaseModel):
    date: str
    new_differential: Optional[float] = None
    course_rating: Optional[float] = None
    gross_score: Optional[int] = None
    playing_handicap: Optional[int] = None
    stableford_points: Optional[int] = None

@api_router.put("/players/{player_id}/update-differential")
async def update_score_differential(player_id: str, request: UpdateDifferentialRequest, user_id: str = None):
    """Update a specific score differential and/or course details (Admin only)"""
    if user_id:
        await require_admin(user_id)
    
    player = await db.players.find_one({"id": player_id}, {"_id": 0})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    handicap_history = player.get("handicap_history", [])
    
    # Find the record by date
    record_idx = None
    for idx, record in enumerate(handicap_history):
        if record.get("date") == request.date:
            record_idx = idx
            break
    
    if record_idx is None:
        raise HTTPException(status_code=404, detail="Record not found for this date")
    
    # Update the fields that were provided
    if request.new_differential is not None:
        handicap_history[record_idx]["score_differential"] = request.new_differential
    if request.course_rating is not None:
        handicap_history[record_idx]["course_rating"] = request.course_rating
    if request.gross_score is not None:
        handicap_history[record_idx]["gross_score"] = request.gross_score
    if request.playing_handicap is not None:
        handicap_history[record_idx]["playing_handicap"] = request.playing_handicap
    if request.stableford_points is not None:
        handicap_history[record_idx]["score"] = request.stableford_points
    
    # If course_rating and stableford were provided, recalculate the differential
    record = handicap_history[record_idx]
    if request.course_rating is not None and (request.stableford_points is not None or record.get("score")):
        pts = request.stableford_points if request.stableford_points is not None else record.get("score", 0)
        slope = record.get("slope_rating", 113)
        par = 72  # Default, could be stored in record
        playing_hcp = request.playing_handicap if request.playing_handicap is not None else record.get("playing_handicap", 18)
        
        if pts and playing_hcp is not None:
            # Recalculate differential
            points_diff = pts - 36
            gross = par + playing_hcp - points_diff
            diff = (gross - request.course_rating) * (113 / slope)
            handicap_history[record_idx]["score_differential"] = round_half_up(diff, 1)
            handicap_history[record_idx]["gross_score"] = gross
    
    # Recalculate all handicaps from this point forward
    # Sort by date to process in order
    sorted_history = sorted(handicap_history, key=lambda x: x.get("date", ""))
    
    for i, record in enumerate(sorted_history):
        # Get all differentials up to and including this record
        available_diffs = [r["score_differential"] for r in sorted_history[:i+1]]
        
        if len(available_diffs) >= 3:
            # WHS: Best 8 of 20 (or proportional for fewer rounds)
            num_to_use = min(8, max(1, len(available_diffs) // 2))
            sorted_diffs = sorted(available_diffs)[:num_to_use]
            avg_diff = sum(sorted_diffs) / len(sorted_diffs)
            new_handicap = round_half_up(avg_diff, 1)
        else:
            avg_diff = sum(available_diffs) / len(available_diffs)
            new_handicap = round_half_up(avg_diff, 1)
        
        record["handicap_after"] = new_handicap
        if i > 0:
            record["handicap_before"] = sorted_history[i-1]["handicap_after"]
    
    # Final handicap is from the most recent record
    final_handicap = sorted_history[-1]["handicap_after"] if sorted_history else player.get("handicap", 18.0)
    
    # Update player
    await db.players.update_one(
        {"id": player_id},
        {
            "$set": {
                "handicap": final_handicap,
                "handicap_history": sorted_history
            }
        }
    )
    
    return {
        "message": "Differential updated",
        "new_handicap": final_handicap,
        "updated_record": sorted_history[record_idx]
    }

class DeleteDifferentialRequest(BaseModel):
    date: str

@api_router.delete("/players/{player_id}/delete-differential")
async def delete_score_differential(player_id: str, date: str, user_id: str = None):
    """Delete a specific score differential and recalculate handicap (Admin only)"""
    if user_id:
        await require_admin(user_id)
    
    player = await db.players.find_one({"id": player_id}, {"_id": 0})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    handicap_history = player.get("handicap_history", [])
    
    # Filter out the record with matching date
    new_history = [r for r in handicap_history if r.get("date") != date]
    
    if len(new_history) == len(handicap_history):
        raise HTTPException(status_code=404, detail="Record not found for this date")
    
    # Recalculate handicaps
    if new_history:
        sorted_history = sorted(new_history, key=lambda x: x.get("date", ""))
        
        for i, record in enumerate(sorted_history):
            available_diffs = [r["score_differential"] for r in sorted_history[:i+1]]
            
            if len(available_diffs) >= 3:
                num_to_use = min(8, max(1, len(available_diffs) // 2))
                sorted_diffs = sorted(available_diffs)[:num_to_use]
                avg_diff = sum(sorted_diffs) / len(sorted_diffs)
                new_handicap = round_half_up(avg_diff, 1)
            else:
                avg_diff = sum(available_diffs) / len(available_diffs)
                new_handicap = round_half_up(avg_diff, 1)
            
            record["handicap_after"] = new_handicap
            if i > 0:
                record["handicap_before"] = sorted_history[i-1]["handicap_after"]
        
        final_handicap = sorted_history[-1]["handicap_after"]
        new_history = sorted_history
    else:
        final_handicap = 18.0  # Default if no history
    
    # Update player
    await db.players.update_one(
        {"id": player_id},
        {
            "$set": {
                "handicap": final_handicap,
                "handicap_history": new_history
            }
        }
    )
    
    return {
        "message": "Differential deleted",
        "new_handicap": final_handicap,
        "remaining_records": len(new_history)
    }

# ============= COURSE ENDPOINTS =============

@api_router.get("/courses", response_model=List[Course])
async def get_courses(society_id: Optional[str] = None):
    """Get all courses, optionally filtered by society"""
    query = {}
    if society_id:
        query["society_id"] = society_id
    courses = await db.courses.find(query, {"_id": 0}).to_list(1000)
    return courses

@api_router.get("/courses/{course_id}", response_model=Course)
async def get_course(course_id: str):
    """Get a specific course by ID"""
    course = await db.courses.find_one({"id": course_id}, {"_id": 0})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course

@api_router.post("/courses", response_model=Course)
async def create_course(course_data: CourseCreate, user_id: str = None):
    """Create a new course with stroke indices (Admin only)"""
    if user_id:
        await require_admin(user_id)
    
    # Validate holes if provided
    if course_data.holes:
        # Check all 18 holes are present with unique stroke indices
        hole_numbers = [h.hole_number for h in course_data.holes]
        stroke_indices = [h.stroke_index for h in course_data.holes]
        
        if len(hole_numbers) != 18 or set(hole_numbers) != set(range(1, 19)):
            raise HTTPException(status_code=400, detail="Must provide exactly 18 holes numbered 1-18")
        
        if len(stroke_indices) != 18 or set(stroke_indices) != set(range(1, 19)):
            raise HTTPException(status_code=400, detail="Stroke indices must be unique values 1-18")
    
    course = Course(**course_data.model_dump())
    doc = course.model_dump()
    await db.courses.insert_one(doc)
    return course

@api_router.put("/courses/{course_id}", response_model=Course)
async def update_course(course_id: str, course_data: CourseUpdate, user_id: str = None):
    """Update an existing course (Admin only)"""
    if user_id:
        await require_admin(user_id)
    
    update_dict = {k: v for k, v in course_data.model_dump().items() if v is not None}
    
    # Convert holes to dict if present
    if "holes" in update_dict and update_dict["holes"]:
        update_dict["holes"] = [h.model_dump() if hasattr(h, 'model_dump') else h for h in update_dict["holes"]]
    
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.courses.update_one({"id": course_id}, {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Course not found")
    
    course = await db.courses.find_one({"id": course_id}, {"_id": 0})
    return course

@api_router.delete("/courses/{course_id}")
async def delete_course(course_id: str, user_id: str = None):
    """Delete a course (Admin only)"""
    if user_id:
        await require_admin(user_id)
    
    result = await db.courses.delete_one({"id": course_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Course not found")
    return {"message": "Course deleted"}

# ============= COMPETITION ENDPOINTS =============

@api_router.get("/competitions", response_model=List[Competition])
async def get_competitions(society_id: Optional[str] = None):
    query = {}
    if society_id:
        query["society_id"] = society_id
    competitions = await db.competitions.find(query, {"_id": 0}).to_list(1000)
    return competitions

@api_router.get("/competitions/{competition_id}", response_model=Competition)
async def get_competition(competition_id: str):
    competition = await db.competitions.find_one({"id": competition_id}, {"_id": 0})
    if not competition:
        raise HTTPException(status_code=404, detail="Competition not found")
    return competition

@api_router.post("/competitions", response_model=Competition)
async def create_competition(competition_data: CompetitionCreate):
    competition = Competition(**competition_data.model_dump())
    doc = competition.model_dump()
    await db.competitions.insert_one(doc)
    return competition

@api_router.put("/competitions/{competition_id}", response_model=Competition)
async def update_competition(competition_id: str, competition_data: CompetitionUpdate):
    update_dict = {k: v for k, v in competition_data.model_dump().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.competitions.update_one({"id": competition_id}, {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Competition not found")
    
    competition = await db.competitions.find_one({"id": competition_id}, {"_id": 0})
    return competition

@api_router.delete("/competitions/{competition_id}")
async def delete_competition(competition_id: str):
    result = await db.competitions.delete_one({"id": competition_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Competition not found")
    # Also delete associated rounds and scores
    rounds = await db.rounds.find({"competition_id": competition_id}).to_list(1000)
    round_ids = [r["id"] for r in rounds]
    await db.rounds.delete_many({"competition_id": competition_id})
    await db.scores.delete_many({"round_id": {"$in": round_ids}})
    return {"message": "Competition and associated data deleted"}

@api_router.post("/competitions/{competition_id}/players/{player_id}")
async def add_player_to_competition(competition_id: str, player_id: str):
    competition = await db.competitions.find_one({"id": competition_id})
    if not competition:
        raise HTTPException(status_code=404, detail="Competition not found")
    
    player = await db.players.find_one({"id": player_id})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    if player_id in competition.get("player_ids", []):
        raise HTTPException(status_code=400, detail="Player already in competition")
    
    await db.competitions.update_one(
        {"id": competition_id},
        {"$push": {"player_ids": player_id}}
    )
    return {"message": "Player added to competition"}

@api_router.delete("/competitions/{competition_id}/players/{player_id}")
async def remove_player_from_competition(competition_id: str, player_id: str):
    competition = await db.competitions.find_one({"id": competition_id})
    if not competition:
        raise HTTPException(status_code=404, detail="Competition not found")
    
    await db.competitions.update_one(
        {"id": competition_id},
        {"$pull": {"player_ids": player_id}}
    )
    return {"message": "Player removed from competition"}

# ============= ROUND ENDPOINTS =============

@api_router.get("/rounds", response_model=List[Round])
async def get_rounds(competition_id: Optional[str] = None):
    query = {"competition_id": competition_id} if competition_id else {}
    rounds = await db.rounds.find(query, {"_id": 0}).to_list(1000)
    return rounds

@api_router.get("/rounds/{round_id}", response_model=Round)
async def get_round(round_id: str):
    round_doc = await db.rounds.find_one({"id": round_id}, {"_id": 0})
    if not round_doc:
        raise HTTPException(status_code=404, detail="Round not found")
    return round_doc

@api_router.post("/rounds", response_model=Round)
async def create_round(round_data: RoundCreate):
    # Verify competition exists
    competition = await db.competitions.find_one({"id": round_data.competition_id})
    if not competition:
        raise HTTPException(status_code=404, detail="Competition not found")
    
    round_obj = Round(**round_data.model_dump())
    if not round_obj.date:
        round_obj.date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    doc = round_obj.model_dump()
    await db.rounds.insert_one(doc)
    return round_obj

@api_router.delete("/rounds/{round_id}")
async def delete_round(round_id: str):
    result = await db.rounds.delete_one({"id": round_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Round not found")
    # Delete associated scores
    await db.scores.delete_many({"round_id": round_id})
    return {"message": "Round and associated scores deleted"}


@api_router.put("/rounds/{round_id}/toggle-inclusion")
async def toggle_round_inclusion(round_id: str):
    """Toggle whether a round is included in the competition"""
    round_doc = await db.rounds.find_one({"id": round_id})
    if not round_doc:
        raise HTTPException(status_code=404, detail="Round not found")
    
    current_status = round_doc.get("is_included", True)
    new_status = not current_status
    
    await db.rounds.update_one(
        {"id": round_id},
        {"$set": {"is_included": new_status}}
    )
    
    return {"message": f"Round {'included' if new_status else 'excluded'}", "is_included": new_status}


@api_router.put("/rounds/{round_id}/toggle-handicap")
async def toggle_round_handicap(round_id: str):
    """Toggle whether a round counts towards handicap calculation"""
    round_doc = await db.rounds.find_one({"id": round_id})
    if not round_doc:
        raise HTTPException(status_code=404, detail="Round not found")
    
    current_status = round_doc.get("counts_for_handicap", True)
    new_status = not current_status
    
    await db.rounds.update_one(
        {"id": round_id},
        {"$set": {"counts_for_handicap": new_status}}
    )
    
    # Get all scores for this round and update handicap histories
    scores = await db.scores.find({"round_id": round_id}, {"_id": 0}).to_list(1000)
    
    for score in scores:
        player_id = score.get("player_id")
        player = await db.players.find_one({"id": player_id})
        if not player:
            continue
        
        handicap_history = player.get("handicap_history", [])
        
        if new_status:
            # Turning ON - add round back to handicap history if score exists
            # Check if record already exists
            existing_idx = None
            for idx, record in enumerate(handicap_history):
                if record.get("round_id") == round_id:
                    existing_idx = idx
                    break
            
            if existing_idx is None and score.get("total_stableford"):
                # Create handicap record for this round
                course_rating = round_doc.get("course_rating", 72.0)
                slope_rating = round_doc.get("slope_rating", 113)
                course_par = round_doc.get("course_par", 72)
                course_name = round_doc.get("course_name", "Unknown")
                round_date = round_doc.get("date", "")
                
                stableford = score.get("total_stableford", 0)
                hcp_before = player.get("handicap", 18.0)
                
                # Calculate playing handicap using WHS formula (single step)
                raw_hcp = hcp_before * (slope_rating / 113) + (course_rating - course_par)
                playing_hcp = int(raw_hcp + 0.5) if raw_hcp >= 0 else int(raw_hcp - 0.5)
                
                # Calculate differential
                points_diff = stableford - 36
                gross_score = course_par + playing_hcp - points_diff
                differential = round_half_up((gross_score - course_rating) * (113 / slope_rating), 1)
                
                handicap_record = {
                    "date": round_date,
                    "round_id": round_id,
                    "course_name": course_name,
                    "score": stableford,
                    "gross_score": gross_score,
                    "playing_handicap": playing_hcp,
                    "par": course_par,
                    "course_rating": course_rating,
                    "slope_rating": slope_rating,
                    "score_differential": differential,
                    "handicap_before": hcp_before,
                    "handicap_after": hcp_before  # Will be recalculated
                }
                handicap_history.append(handicap_record)
        else:
            # Turning OFF - remove round from handicap history
            handicap_history = [r for r in handicap_history if r.get("round_id") != round_id]
        
        # Recalculate handicap from remaining differentials
        all_differentials = [r.get("score_differential", 0) for r in handicap_history]
        new_handicap = calculate_handicap_index(all_differentials) if all_differentials else player.get("handicap", 18.0)
        
        # Update handicap_after for the last record if history exists
        if handicap_history:
            # Sort by date and update handicap_after values
            sorted_history = sorted(handicap_history, key=lambda x: x.get("date", ""))
            for i, record in enumerate(sorted_history):
                diffs_up_to_now = [r.get("score_differential", 0) for r in sorted_history[:i+1]]
                record["handicap_after"] = calculate_handicap_index(diffs_up_to_now)
            handicap_history = sorted_history
        
        await db.players.update_one(
            {"id": player_id},
            {"$set": {
                "handicap": new_handicap,
                "handicap_history": handicap_history
            }}
        )
    
    return {"message": f"Round {'counts' if new_status else 'excluded'} for handicap", "counts_for_handicap": new_status}



# ============= SCORE ENDPOINTS =============

@api_router.get("/scores", response_model=List[Score])
async def get_scores(round_id: Optional[str] = None, player_id: Optional[str] = None):
    query = {}
    if round_id:
        query["round_id"] = round_id
    if player_id:
        query["player_id"] = player_id
    scores = await db.scores.find(query, {"_id": 0}).to_list(1000)
    return scores

@api_router.get("/scores/{score_id}", response_model=Score)
async def get_score(score_id: str):
    score = await db.scores.find_one({"id": score_id}, {"_id": 0})
    if not score:
        raise HTTPException(status_code=404, detail="Score not found")
    return score

@api_router.post("/scores", response_model=Score)
async def create_score(score_data: ScoreCreate):
    # Check if score already exists
    existing = await db.scores.find_one({
        "round_id": score_data.round_id,
        "player_id": score_data.player_id
    })
    if existing:
        raise HTTPException(status_code=400, detail="Score already exists for this player in this round")
    
    # Get player handicap
    player = await db.players.find_one({"id": score_data.player_id})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    # Get round info
    round_doc = await db.rounds.find_one({"id": score_data.round_id})
    if not round_doc:
        raise HTTPException(status_code=404, detail="Round not found")
    
    score = Score(
        round_id=score_data.round_id,
        player_id=score_data.player_id,
        player_handicap=player["handicap"]
    )
    doc = score.model_dump()
    await db.scores.insert_one(doc)
    return score

@api_router.put("/scores/{score_id}/holes", response_model=Score)
async def update_score_holes(score_id: str, holes_data: List[HoleScore]):
    score = await db.scores.find_one({"id": score_id})
    if not score:
        raise HTTPException(status_code=404, detail="Score not found")
    
    # Get round to determine number of holes
    round_doc = await db.rounds.find_one({"id": score["round_id"]})
    num_holes = 18  # Default
    if round_doc:
        competition = await db.competitions.find_one({"id": round_doc["competition_id"]})
        if competition:
            num_holes = competition.get("num_holes", 18)
    
    # Calculate handicap strokes distribution
    handicap_strokes = distribute_handicap_strokes(score["player_handicap"], num_holes)
    
    # Calculate stableford points for each hole
    updated_holes = []
    total_strokes = 0
    total_stableford = 0
    
    for hole in holes_data:
        hole_idx = hole.hole_number - 1
        h_strokes = handicap_strokes[hole_idx] if hole_idx < len(handicap_strokes) else 0
        stableford_pts = calculate_stableford(hole.strokes, hole.par, h_strokes)
        
        updated_hole = HoleScore(
            hole_number=hole.hole_number,
            par=hole.par,
            strokes=hole.strokes,
            stableford_points=stableford_pts
        )
        updated_holes.append(updated_hole.model_dump())
        total_strokes += hole.strokes
        total_stableford += stableford_pts
    
    await db.scores.update_one(
        {"id": score_id},
        {"$set": {
            "holes": updated_holes,
            "total_strokes": total_strokes,
            "total_stableford": total_stableford
        }}
    )
    
    updated_score = await db.scores.find_one({"id": score_id}, {"_id": 0})
    return updated_score

@api_router.put("/scores/{score_id}/points", response_model=Score)
async def update_score_points(score_id: str, points_data: ScorePointsUpdate):
    """Update score with just total Stableford points (simplified entry)"""
    score = await db.scores.find_one({"id": score_id})
    if not score:
        raise HTTPException(status_code=404, detail="Score not found")
    
    # Get round info for course details
    round_doc = await db.rounds.find_one({"id": score["round_id"]})
    if not round_doc:
        raise HTTPException(status_code=404, detail="Round not found")
    
    # Get player for handicap update
    player = await db.players.find_one({"id": score["player_id"]})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    # Update the score
    await db.scores.update_one(
        {"id": score_id},
        {"$set": {
            "total_stableford": points_data.total_stableford,
            "holes": [],
            "total_strokes": 0
        }}
    )
    
    # Check if this round counts for handicap calculation
    counts_for_handicap = round_doc.get("counts_for_handicap", True)
    
    # Calculate score differential and update handicap (WHS) only if round counts
    course_rating = round_doc.get("course_rating", round_doc.get("course_par", 72))  # Use actual course rating
    slope_rating = round_doc.get("slope_rating", 113)
    course_par = round_doc.get("course_par", 72)
    course_name = round_doc.get("course_name", "Unknown Course")
    round_date = round_doc.get("date", datetime.now(timezone.utc).strftime("%Y-%m-%d"))
    
    # Get player's handicap before this round
    current_handicap = player.get("handicap", 18.0)
    
    # Use provided playing_handicap or calculate from handicap index
    playing_hcp = points_data.playing_handicap if points_data.playing_handicap is not None else None
    
    score_differential = calculate_score_differential(
        points_data.total_stableford,
        course_rating,
        slope_rating,
        course_par,
        current_handicap,
        playing_hcp  # Pass explicit playing handicap if provided
    )
    
    # Get existing handicap history
    handicap_history = player.get("handicap_history", [])
    
    # Check if we already have a record for this round (update instead of add)
    existing_record_idx = None
    for idx, record in enumerate(handicap_history):
        if record.get("round_id") == score["round_id"]:
            existing_record_idx = idx
            break
    
    # Only update handicap if this round counts
    if counts_for_handicap:
        # Get all differentials for calculation
        all_differentials = [r.get("score_differential", 0) for r in handicap_history]
        
        if existing_record_idx is not None:
            # Update existing differential
            all_differentials[existing_record_idx] = score_differential
        else:
            # Add new differential
            all_differentials.append(score_differential)
        
        # Calculate new handicap
        new_handicap = calculate_handicap_index(all_differentials)
    else:
        # Keep existing handicap
        new_handicap = current_handicap
    
    # Calculate playing handicap using WHS formula (single step)
    if playing_hcp is not None:
        actual_playing_hcp = playing_hcp
    else:
        raw_hcp = current_handicap * (slope_rating / 113) + (course_rating - course_par)
        actual_playing_hcp = int(raw_hcp + 0.5) if raw_hcp >= 0 else int(raw_hcp - 0.5)
    
    points_diff = points_data.total_stableford - 36
    gross_score = course_par + actual_playing_hcp - points_diff
    
    # Create handicap record (only if counts for handicap)
    if counts_for_handicap:
        handicap_record = {
            "date": round_date,
            "round_id": score["round_id"],
            "course_name": course_name,
            "score": points_data.total_stableford,
            "gross_score": gross_score,
            "playing_handicap": actual_playing_hcp,
            "par": course_par,
            "course_rating": course_rating,
            "slope_rating": slope_rating,
            "score_differential": score_differential,
            "handicap_before": current_handicap,
            "handicap_after": new_handicap
        }
        
        if existing_record_idx is not None:
            # Update existing record
            handicap_history[existing_record_idx] = handicap_record
        else:
            # Add new record
            handicap_history.append(handicap_record)
        
        # Update player with new handicap and history
        await db.players.update_one(
            {"id": score["player_id"]},
            {"$set": {
                "handicap": new_handicap,
                "handicap_history": handicap_history
            }}
        )
    elif existing_record_idx is not None:
        # Round no longer counts - remove from handicap history
        handicap_history.pop(existing_record_idx)
        # Recalculate handicap without this round
        all_differentials = [r.get("score_differential", 0) for r in handicap_history]
        new_handicap = calculate_handicap_index(all_differentials) if all_differentials else current_handicap
        await db.players.update_one(
            {"id": score["player_id"]},
            {"$set": {
                "handicap": new_handicap,
                "handicap_history": handicap_history
            }}
        )
    
    updated_score = await db.scores.find_one({"id": score_id}, {"_id": 0})
    return updated_score

# ============= LEADERBOARD ENDPOINT =============

@api_router.get("/leaderboard/{competition_id}", response_model=List[LeaderboardEntry])
async def get_leaderboard(competition_id: str):
    competition = await db.competitions.find_one({"id": competition_id})
    if not competition:
        raise HTTPException(status_code=404, detail="Competition not found")
    
    min_rounds = competition.get("min_rounds", 13)
    
    # Get all rounds for this competition, sorted by date (only included rounds count for scores)
    all_rounds = await db.rounds.find({"competition_id": competition_id}, {"_id": 0}).to_list(1000)
    all_rounds.sort(key=lambda r: r.get("date", ""))
    
    # Filter to only included rounds for scoring
    included_rounds = [r for r in all_rounds if r.get("is_included", True)]
    included_round_ids = [r["id"] for r in included_rounds]
    
    # Get all scores for included rounds only
    scores = await db.scores.find({"round_id": {"$in": included_round_ids}}, {"_id": 0}).to_list(1000)
    
    # Create a map of round_id to index for ordering (using all rounds for display)
    round_index_map = {r["id"]: idx for idx, r in enumerate(all_rounds)}
    
    # Aggregate by player
    player_scores = {}
    for score in scores:
        pid = score["player_id"]
        if pid not in player_scores:
            player_scores[pid] = {
                "rounds_played": 0,
                "total_stableford": 0,
                "round_scores": [None] * len(all_rounds)  # Initialize with None for each round
            }
        round_idx = round_index_map.get(score["round_id"])
        if round_idx is not None:
            player_scores[pid]["round_scores"][round_idx] = score.get("total_stableford", 0)
        player_scores[pid]["rounds_played"] += 1
        player_scores[pid]["total_stableford"] += score.get("total_stableford", 0)
    
    # Build leaderboard entries
    leaderboard = []
    for pid, data in player_scores.items():
        player = await db.players.find_one({"id": pid}, {"_id": 0})
        if player:
            round_scores = data["round_scores"]
            rounds_played = data["rounds_played"]
            
            # Get valid scores (non-None) with their indices
            valid_scores_with_idx = [(idx, score) for idx, score in enumerate(round_scores) if score is not None]
            
            # Sort by score descending to find best rounds
            sorted_scores = sorted(valid_scores_with_idx, key=lambda x: x[1], reverse=True)
            
            # Determine counting and dropped rounds
            dropped_indices = []
            counting_scores = []
            
            if rounds_played > min_rounds:
                # Only count the best min_rounds scores
                counting_rounds = sorted_scores[:min_rounds]
                dropped_rounds_list = sorted_scores[min_rounds:]
                
                counting_scores = [s[1] for s in counting_rounds]
                dropped_indices = [s[0] for s in dropped_rounds_list]
            else:
                # All rounds count
                counting_scores = [s[1] for s in sorted_scores]
            
            counting_total = sum(counting_scores)
            counting_count = len(counting_scores)
            avg_stableford = counting_total / counting_count if counting_count > 0 else 0.0
            
            # Convert None to -1 for display
            display_scores = [s if s is not None else -1 for s in round_scores]
            qualified = rounds_played >= min_rounds
            
            leaderboard.append(LeaderboardEntry(
                player_id=pid,
                player_username=player["username"],
                player_handicap=player["handicap"],
                player_team_logo=player.get("team_logo", ""),
                rounds_played=rounds_played,
                total_stableford=data["total_stableford"],
                counting_total=counting_total,
                average_stableford=round(avg_stableford, 1),
                round_scores=display_scores,
                dropped_rounds=dropped_indices,
                qualified=qualified
            ))
    
    # Sort by average stableford (descending)
    leaderboard.sort(key=lambda x: x.average_stableford, reverse=True)
    return leaderboard

# ============= SESSION/AUTH ENDPOINTS =============

class LoginRequest(BaseModel):
    username: str
    society_id: Optional[str] = None
    join_code: Optional[str] = None

class LoginResponse(BaseModel):
    player: Player
    message: str
    needs_society: bool = False

@api_router.post("/login", response_model=LoginResponse)
async def login(login_data: LoginRequest):
    # If join_code provided, find society
    society_id = login_data.society_id
    if login_data.join_code:
        society = await db.societies.find_one({"join_code": login_data.join_code.upper()}, {"_id": 0})
        if society:
            society_id = society["id"]
        else:
            raise HTTPException(status_code=404, detail="Invalid society code")
    
    # Find player by username AND society
    if society_id:
        player = await db.players.find_one(
            {"username": login_data.username, "society_id": society_id}, 
            {"_id": 0}
        )
    else:
        # Try to find a player with this username who has a society (prioritize this)
        player = await db.players.find_one(
            {"username": login_data.username, "society_id": {"$ne": None}}, 
            {"_id": 0}
        )
        if player:
            # Player exists in a society, return it
            return LoginResponse(player=Player(**player), message="Welcome back")
        
        # Check if player exists without a society
        player = await db.players.find_one(
            {"username": login_data.username, "society_id": None}, 
            {"_id": 0}
        )
        if player:
            # Legacy player without society - needs to join one
            return LoginResponse(player=Player(**player), message="Please join or create a society", needs_society=True)
    
    if not player:
        if society_id:
            # Create new player in this society
            new_player = Player(username=login_data.username, society_id=society_id)
            doc = new_player.model_dump()
            await db.players.insert_one(doc)
            
            # Check if first player in society - make them admin
            player_count = await db.players.count_documents({"society_id": society_id})
            if player_count == 1:
                await db.players.update_one(
                    {"id": new_player.id},
                    {"$set": {"is_admin": True}}
                )
                await db.societies.update_one(
                    {"id": society_id},
                    {"$set": {"admin_id": new_player.id}}
                )
                new_player.is_admin = True
                return LoginResponse(player=new_player, message="New player created - you are the society admin!")
            
            return LoginResponse(player=new_player, message="New player created")
        else:
            # No society - prompt user to join or create one
            new_player = Player(username=login_data.username)
            doc = new_player.model_dump()
            await db.players.insert_one(doc)
            return LoginResponse(player=new_player, message="Please join or create a society", needs_society=True)
    
    return LoginResponse(player=Player(**player), message="Welcome back")

@api_router.get("/check-username/{username}")
async def check_username(username: str):
    """Check if a username already exists in the system"""
    # Check for any player with this username that has a society (name is taken)
    player_with_society = await db.players.find_one(
        {"username": username, "society_id": {"$ne": None}}, 
        {"_id": 0}
    )
    
    if player_with_society:
        # Name is taken by someone in a society - they should use Sign In
        return {
            "exists": True,
            "has_society": True,
            "message": "This name is already taken. Please use 'Sign In' instead."
        }
    
    # Check if player exists without a society (legacy account)
    player_without_society = await db.players.find_one(
        {"username": username, "society_id": None}, 
        {"_id": 0}
    )
    
    if player_without_society:
        # Legacy account exists - they should use Sign In
        return {
            "exists": True,
            "has_society": False,
            "message": "This name is already registered. Please use 'Sign In' instead."
        }
    
    # Username is completely available
    return {
        "exists": False,
        "has_society": False,
        "message": "Username is available"
    }

class UserSociety(BaseModel):
    society_id: str
    society_name: str
    player_id: str
    is_admin: bool

@api_router.get("/user-societies/{username}")
async def get_user_societies(username: str):
    """Get all societies a user belongs to"""
    # Find all players with this username that have a society
    players = await db.players.find(
        {"username": username, "society_id": {"$ne": None}},
        {"_id": 0}
    ).to_list(100)
    
    if not players:
        return []
    
    # Get society details for each player
    societies = []
    for player in players:
        society = await db.societies.find_one(
            {"id": player["society_id"]},
            {"_id": 0}
        )
        if society:
            societies.append(UserSociety(
                society_id=society["id"],
                society_name=society["name"],
                player_id=player["id"],
                is_admin=player.get("is_admin", False)
            ))
    
    return societies

@api_router.post("/switch-society")
async def switch_society(username: str, society_id: str):
    """Switch to a different society for the user"""
    # Find the player in the target society
    player = await db.players.find_one(
        {"username": username, "society_id": society_id},
        {"_id": 0}
    )
    
    if not player:
        raise HTTPException(status_code=404, detail="You are not a member of this society")
    
    return {"player": Player(**player), "message": "Switched society"}

# ============= ROOT ENDPOINT =============

@api_router.get("/")
async def root():
    return {"message": "Golf Stableford Competition API"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
