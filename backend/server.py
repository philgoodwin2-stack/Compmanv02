from fastapi import FastAPI, HTTPException, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uuid
from dotenv import load_dotenv

load_dotenv()

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "budget_app")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="Personal Budget API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api")

# Preset Categories
INCOME_CATEGORIES = [
    {"id": "salary", "name": "Salary", "type": "income", "icon": "💼", "color": "#22c55e"},
    {"id": "freelance", "name": "Freelance", "type": "income", "icon": "💻", "color": "#10b981"},
    {"id": "investments", "name": "Investments", "type": "income", "icon": "📈", "color": "#14b8a6"},
    {"id": "gifts", "name": "Gifts", "type": "income", "icon": "🎁", "color": "#06b6d4"},
    {"id": "other_income", "name": "Other Income", "type": "income", "icon": "💰", "color": "#0ea5e9"},
]

EXPENSE_CATEGORIES = [
    {"id": "rent", "name": "Rent/Mortgage", "type": "expense", "icon": "🏠", "color": "#ef4444"},
    {"id": "utilities", "name": "Utilities", "type": "expense", "icon": "💡", "color": "#f97316"},
    {"id": "groceries", "name": "Groceries", "type": "expense", "icon": "🛒", "color": "#f59e0b"},
    {"id": "transport", "name": "Transport", "type": "expense", "icon": "🚗", "color": "#eab308"},
    {"id": "entertainment", "name": "Entertainment", "type": "expense", "icon": "🎬", "color": "#84cc16"},
    {"id": "dining", "name": "Dining Out", "type": "expense", "icon": "🍽️", "color": "#a855f7"},
    {"id": "shopping", "name": "Shopping", "type": "expense", "icon": "🛍️", "color": "#ec4899"},
    {"id": "healthcare", "name": "Healthcare", "type": "expense", "icon": "🏥", "color": "#f43f5e"},
    {"id": "subscriptions", "name": "Subscriptions", "type": "expense", "icon": "📱", "color": "#6366f1"},
    {"id": "education", "name": "Education", "type": "expense", "icon": "📚", "color": "#8b5cf6"},
    {"id": "other_expense", "name": "Other", "type": "expense", "icon": "📦", "color": "#64748b"},
]

ALL_CATEGORIES = INCOME_CATEGORIES + EXPENSE_CATEGORIES

# Models
class TransactionBase(BaseModel):
    amount: float
    category_id: str
    description: Optional[str] = ""
    date: str  # ISO date string YYYY-MM-DD
    type: str  # "income" or "expense"

class Transaction(TransactionBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class BudgetBase(BaseModel):
    category_id: str
    amount: float
    month: str  # YYYY-MM format

class Budget(BudgetBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))

class BudgetUpdate(BaseModel):
    amount: float

# Routes

@api_router.get("/")
async def root():
    return {"message": "Personal Budget API"}

@api_router.get("/categories")
async def get_categories():
    return {
        "income": INCOME_CATEGORIES,
        "expense": EXPENSE_CATEGORIES,
        "all": ALL_CATEGORIES
    }

# Transaction endpoints
@api_router.get("/transactions")
async def get_transactions(
    month: Optional[str] = None,
    category_id: Optional[str] = None,
    type: Optional[str] = None,
    limit: int = 100
):
    query = {}
    if month:
        # Filter by month (YYYY-MM)
        query["date"] = {"$regex": f"^{month}"}
    if category_id:
        query["category_id"] = category_id
    if type:
        query["type"] = type
    
    transactions = await db.transactions.find(query, {"_id": 0}).sort("date", -1).limit(limit).to_list(limit)
    return transactions

@api_router.post("/transactions")
async def create_transaction(transaction: TransactionBase):
    new_transaction = Transaction(**transaction.model_dump())
    await db.transactions.insert_one(new_transaction.model_dump())
    return new_transaction.model_dump()

@api_router.put("/transactions/{transaction_id}")
async def update_transaction(transaction_id: str, transaction: TransactionBase):
    result = await db.transactions.update_one(
        {"id": transaction_id},
        {"$set": transaction.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    updated = await db.transactions.find_one({"id": transaction_id}, {"_id": 0})
    return updated

@api_router.delete("/transactions/{transaction_id}")
async def delete_transaction(transaction_id: str):
    result = await db.transactions.delete_one({"id": transaction_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return {"message": "Transaction deleted"}

# Budget endpoints
@api_router.get("/budgets")
async def get_budgets(month: Optional[str] = None):
    query = {}
    if month:
        query["month"] = month
    budgets = await db.budgets.find(query, {"_id": 0}).to_list(100)
    return budgets

@api_router.post("/budgets")
async def create_or_update_budget(budget: BudgetBase):
    # Upsert - update if exists, create if not
    existing = await db.budgets.find_one({
        "category_id": budget.category_id,
        "month": budget.month
    })
    
    if existing:
        await db.budgets.update_one(
            {"id": existing["id"]},
            {"$set": {"amount": budget.amount}}
        )
        updated = await db.budgets.find_one({"id": existing["id"]}, {"_id": 0})
        return updated
    else:
        new_budget = Budget(**budget.model_dump())
        await db.budgets.insert_one(new_budget.model_dump())
        return new_budget.model_dump()

@api_router.delete("/budgets/{budget_id}")
async def delete_budget(budget_id: str):
    result = await db.budgets.delete_one({"id": budget_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Budget not found")
    return {"message": "Budget deleted"}

# Analytics endpoints
@api_router.get("/summary")
async def get_summary(month: Optional[str] = None):
    """Get financial summary for dashboard"""
    query = {}
    if month:
        query["date"] = {"$regex": f"^{month}"}
    
    transactions = await db.transactions.find(query, {"_id": 0}).to_list(1000)
    
    total_income = sum(t["amount"] for t in transactions if t["type"] == "income")
    total_expenses = sum(t["amount"] for t in transactions if t["type"] == "expense")
    balance = total_income - total_expenses
    
    # Group by category
    category_totals = {}
    for t in transactions:
        cat_id = t["category_id"]
        if cat_id not in category_totals:
            category_totals[cat_id] = {"income": 0, "expense": 0}
        category_totals[cat_id][t["type"]] += t["amount"]
    
    # Get budgets for the month
    budgets = []
    if month:
        budgets = await db.budgets.find({"month": month}, {"_id": 0}).to_list(100)
    
    # Calculate budget progress
    budget_progress = []
    for budget in budgets:
        spent = category_totals.get(budget["category_id"], {}).get("expense", 0)
        budget_progress.append({
            "category_id": budget["category_id"],
            "budgeted": budget["amount"],
            "spent": spent,
            "remaining": budget["amount"] - spent,
            "percentage": (spent / budget["amount"] * 100) if budget["amount"] > 0 else 0
        })
    
    return {
        "total_income": total_income,
        "total_expenses": total_expenses,
        "balance": balance,
        "transaction_count": len(transactions),
        "category_totals": category_totals,
        "budget_progress": budget_progress
    }

@api_router.get("/analytics/trends")
async def get_trends(months: int = 6):
    """Get spending trends over time"""
    from datetime import datetime, timedelta
    
    # Get data for last N months
    today = datetime.now()
    month_data = []
    
    for i in range(months - 1, -1, -1):
        # Calculate month
        target_date = today - timedelta(days=i * 30)
        month_str = target_date.strftime("%Y-%m")
        
        # Get transactions for this month
        transactions = await db.transactions.find(
            {"date": {"$regex": f"^{month_str}"}},
            {"_id": 0}
        ).to_list(1000)
        
        income = sum(t["amount"] for t in transactions if t["type"] == "income")
        expenses = sum(t["amount"] for t in transactions if t["type"] == "expense")
        
        month_data.append({
            "month": month_str,
            "month_label": target_date.strftime("%b %Y"),
            "income": income,
            "expenses": expenses,
            "savings": income - expenses
        })
    
    return month_data

@api_router.get("/analytics/by-category")
async def get_category_breakdown(month: Optional[str] = None, type: str = "expense"):
    """Get breakdown by category"""
    query = {"type": type}
    if month:
        query["date"] = {"$regex": f"^{month}"}
    
    transactions = await db.transactions.find(query, {"_id": 0}).to_list(1000)
    
    # Group by category
    category_totals = {}
    for t in transactions:
        cat_id = t["category_id"]
        if cat_id not in category_totals:
            category_totals[cat_id] = 0
        category_totals[cat_id] += t["amount"]
    
    # Get category info
    result = []
    categories = INCOME_CATEGORIES if type == "income" else EXPENSE_CATEGORIES
    cat_map = {c["id"]: c for c in categories}
    
    total = sum(category_totals.values())
    
    for cat_id, amount in sorted(category_totals.items(), key=lambda x: x[1], reverse=True):
        cat_info = cat_map.get(cat_id, {"name": cat_id, "icon": "📦", "color": "#64748b"})
        result.append({
            "category_id": cat_id,
            "category_name": cat_info["name"],
            "icon": cat_info["icon"],
            "color": cat_info["color"],
            "amount": amount,
            "percentage": (amount / total * 100) if total > 0 else 0
        })
    
    return result

app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
