from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from enum import Enum

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

class PlayerBase(BaseModel):
    username: str
    handicap: float = 18.0
    is_active: bool = True
    team_logo: str = ""

class PlayerCreate(PlayerBase):
    pass

class PlayerUpdate(BaseModel):
    username: Optional[str] = None
    handicap: Optional[float] = None
    is_active: Optional[bool] = None
    team_logo: Optional[str] = None

class HandicapRecord(BaseModel):
    date: str
    round_id: str
    course_name: str
    score: int  # Stableford points
    course_rating: float = 72.0
    slope_rating: int = 113
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

class CompetitionCreate(CompetitionBase):
    pass

class CompetitionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[CompetitionStatus] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    min_rounds: Optional[int] = None

class Competition(CompetitionBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    player_ids: List[str] = []
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    min_rounds: int = 13

class RoundBase(BaseModel):
    competition_id: str
    round_number: int
    name: Optional[str] = ""
    date: Optional[str] = None
    course_name: Optional[str] = ""
    tee: Optional[str] = ""
    slope_rating: Optional[int] = 113
    course_par: int = 72

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
    average_stableford: float = 0.0
    round_scores: List[int] = []
    qualified: bool = False

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

def calculate_score_differential(stableford_points: int, course_rating: float, slope_rating: int, par: int = 72) -> float:
    """
    Calculate score differential based on World Handicap System.
    For Stableford: Convert points to approximate gross score, then calculate differential.
    36 points = playing to handicap (par net)
    Each point above/below 36 = 1 stroke better/worse than handicap
    """
    # Convert Stableford to approximate strokes relative to par
    # 36 points = par (for a scratch golfer playing to their handicap)
    points_diff = stableford_points - 36
    # Approximate gross score (lower is better, so subtract points diff)
    approx_gross = par - points_diff
    
    # Score Differential = (Adjusted Gross Score - Course Rating) × (113 / Slope Rating)
    differential = (approx_gross - course_rating) * (113 / slope_rating)
    return round(differential, 1)

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
    return round(min(max(handicap, 0.0), 54.0), 1)

# ============= PLAYER ENDPOINTS =============

@api_router.get("/players", response_model=List[Player])
async def get_players(active_only: bool = False):
    query = {"is_active": True} if active_only else {}
    players = await db.players.find(query, {"_id": 0}).to_list(1000)
    return players

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

@api_router.get("/players/{player_id}/handicap-history")
async def get_player_handicap_history(player_id: str):
    """Get the handicap history for a player"""
    player = await db.players.find_one({"id": player_id}, {"_id": 0})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    return {
        "player_id": player_id,
        "username": player.get("username"),
        "current_handicap": player.get("handicap", 18.0),
        "history": player.get("handicap_history", [])
    }

# ============= COMPETITION ENDPOINTS =============

@api_router.get("/competitions", response_model=List[Competition])
async def get_competitions():
    competitions = await db.competitions.find({}, {"_id": 0}).to_list(1000)
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
    
    # Calculate score differential and update handicap (WHS)
    course_rating = round_doc.get("course_par", 72)  # Use par as course rating approximation
    slope_rating = round_doc.get("slope_rating", 113)
    course_name = round_doc.get("course_name", "Unknown Course")
    round_date = round_doc.get("date", datetime.now(timezone.utc).strftime("%Y-%m-%d"))
    
    score_differential = calculate_score_differential(
        points_data.total_stableford,
        course_rating,
        slope_rating,
        round_doc.get("course_par", 72)
    )
    
    # Get existing handicap history
    handicap_history = player.get("handicap_history", [])
    current_handicap = player.get("handicap", 18.0)
    
    # Check if we already have a record for this round (update instead of add)
    existing_record_idx = None
    for idx, record in enumerate(handicap_history):
        if record.get("round_id") == score["round_id"]:
            existing_record_idx = idx
            break
    
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
    
    # Create handicap record
    handicap_record = {
        "date": round_date,
        "round_id": score["round_id"],
        "course_name": course_name,
        "score": points_data.total_stableford,
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
    
    updated_score = await db.scores.find_one({"id": score_id}, {"_id": 0})
    return updated_score

# ============= LEADERBOARD ENDPOINT =============

@api_router.get("/leaderboard/{competition_id}", response_model=List[LeaderboardEntry])
async def get_leaderboard(competition_id: str):
    competition = await db.competitions.find_one({"id": competition_id})
    if not competition:
        raise HTTPException(status_code=404, detail="Competition not found")
    
    min_rounds = competition.get("min_rounds", 13)
    
    # Get all rounds for this competition, sorted by date
    rounds = await db.rounds.find({"competition_id": competition_id}, {"_id": 0}).to_list(1000)
    rounds.sort(key=lambda r: r.get("date", ""))
    round_ids = [r["id"] for r in rounds]
    
    # Get all scores for these rounds
    scores = await db.scores.find({"round_id": {"$in": round_ids}}, {"_id": 0}).to_list(1000)
    
    # Create a map of round_id to index for ordering
    round_index_map = {r["id"]: idx for idx, r in enumerate(rounds)}
    
    # Aggregate by player
    player_scores = {}
    for score in scores:
        pid = score["player_id"]
        if pid not in player_scores:
            player_scores[pid] = {
                "rounds_played": 0,
                "total_stableford": 0,
                "round_scores": [None] * len(rounds)  # Initialize with None for each round
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
            avg_stableford = data["total_stableford"] / data["rounds_played"] if data["rounds_played"] > 0 else 0.0
            # Convert None to -1 or keep as list with actual values
            round_scores = [s if s is not None else -1 for s in data["round_scores"]]
            qualified = data["rounds_played"] >= min_rounds
            leaderboard.append(LeaderboardEntry(
                player_id=pid,
                player_username=player["username"],
                player_handicap=player["handicap"],
                player_team_logo=player.get("team_logo", ""),
                rounds_played=data["rounds_played"],
                total_stableford=data["total_stableford"],
                average_stableford=round(avg_stableford, 1),
                round_scores=round_scores,
                qualified=qualified
            ))
    
    # Sort by average stableford (descending)
    leaderboard.sort(key=lambda x: x.average_stableford, reverse=True)
    return leaderboard

# ============= SESSION/AUTH ENDPOINTS =============

class LoginRequest(BaseModel):
    username: str

class LoginResponse(BaseModel):
    player: Player
    message: str

@api_router.post("/login", response_model=LoginResponse)
async def login(login_data: LoginRequest):
    player = await db.players.find_one({"username": login_data.username}, {"_id": 0})
    if not player:
        # Create new player
        new_player = Player(username=login_data.username)
        doc = new_player.model_dump()
        await db.players.insert_one(doc)
        return LoginResponse(player=new_player, message="New player created")
    return LoginResponse(player=Player(**player), message="Welcome back")

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
