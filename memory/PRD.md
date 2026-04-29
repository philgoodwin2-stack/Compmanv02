# BudgetPro - Personal Finance Tracker

## Overview
A personal budget tracking application to monitor income, expenses, and spending trends over time.

## Core Features
- **Dashboard**: Overview of financial health with net balance, income, expenses, budget progress, and recent transactions
- **Transactions**: Track income and expenses with categories, descriptions, and dates
- **Budgets**: Set monthly spending limits per category and track progress
- **Analytics**: View spending trends over 6 months, category breakdowns

## Tech Stack
- **Frontend**: React, Tailwind CSS, Shadcn UI, Dark Theme
- **Backend**: FastAPI, MongoDB
- **Styling**: Dark finance app aesthetic (#0a0a0a background, emerald/red accents)

## Categories

### Income Categories
- Salary, Freelance, Investments, Gifts, Other Income

### Expense Categories  
- Rent/Mortgage, Utilities, Groceries, Transport, Entertainment
- Dining Out, Shopping, Healthcare, Subscriptions, Education, Other

## API Endpoints
- `GET /api/categories` - List all categories
- `GET/POST/PUT/DELETE /api/transactions` - CRUD transactions
- `GET/POST/DELETE /api/budgets` - Manage monthly budgets
- `GET /api/summary` - Dashboard summary with budget progress
- `GET /api/analytics/trends` - 6 month income/expense trends
- `GET /api/analytics/by-category` - Category breakdown

## Features Completed
- ✅ Dashboard with financial overview (Apr 2026)
- ✅ Transaction tracking (add, edit, delete) (Apr 2026)
- ✅ Monthly budget management (Apr 2026)
- ✅ Spending analytics and trends (Apr 2026)
- ✅ Dark finance theme styling (Apr 2026)
- ✅ Month navigation across all pages (Apr 2026)
- ✅ Category icons and colors (Apr 2026)

## Future Enhancements
- P2: Recurring transactions
- P2: Multiple bank account tracking
- P2: Bill reminders
- P2: Export to CSV/PDF
- P3: Mobile app (React Native)
- P3: Bank integration (Plaid/Open Banking)
