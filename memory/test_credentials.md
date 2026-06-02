# Test Credentials

## Authenticated User Accounts (Email/Password Auth)

| Email | Password | Role | Linked Player | Notes |
|-------|----------|------|---------------|-------|
| admin@scoretracker.com | Admin123! | admin | None (link to TestAdmin) | Seeded admin account |

## Player Profiles (Existing Golf Data)

### Global Admin Users
| Username | Society | is_global_admin | Notes |
|----------|---------|-----------------|-------|
| TestAdmin | Test Golf Society | **true** | Has rights across ALL societies |

### Society Admin Users (Preview Environment)
| Username | Society | Join Code | is_admin | Notes |
|----------|---------|-----------|----------|-------|
| TestAdmin | Test Golf Society | TW83XM | true | Also Global Admin |
| phil g | vt vert | 9ACURL | true | Society admin only |
| phil g | WhatsApp | FJSUWB | true | Society admin only |

### Regular Users
| Username | Society | is_admin |
|----------|---------|----------|
| Gem G | WhatsApp | false |
| Tim G | WhatsApp | false |

## How Authentication Works

### New Auth Flow (Email/Password + Player Linking)
1. **Register** - Create account with email, password, and name at `/api/auth/register`
2. **Login** - Sign in with email/password at `/api/auth/login`
3. **Link Player** - Link authenticated account to existing player profile at `/api/auth/link-player`
4. **Access App** - Once player is linked, user can access Dashboard and all features

### JWT Token Storage
- **Access Token**: httpOnly cookie, expires in 15 minutes
- **Refresh Token**: httpOnly cookie, expires in 7 days

### API Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/logout` - Clear session cookies
- `GET /api/auth/me` - Get current authenticated user
- `GET /api/auth/available-players` - Get players available for linking
- `POST /api/auth/link-player` - Link player to authenticated user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

## Admin System Explained

### Society Admin
- Can manage ONLY their own society
- Gold badge on UI
- Toggle via "Admin" button on Players page

### Global Admin (Super-Admin)
- Can manage ALL societies
- Purple badge on UI
- Toggle via "Global" button on Players page (only visible to other global admins)

## How to Create First Global Admin
Via API call (no auth required for first one):
```bash
# Get player ID first
curl https://yourapp.com/api/players | jq '.[] | select(.username=="YourUsername")'

# Make them global admin
curl -X PUT "https://yourapp.com/api/players/{player_id}/toggle-global-admin"
```

## Testing Auth Features

### Test Registration:
```bash
curl -X POST "https://score-tracker-177.preview.emergentagent.com/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"newuser@example.com","password":"Test123!","name":"New User"}'
```

### Test Login:
```bash
curl -X POST "https://score-tracker-177.preview.emergentagent.com/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@scoretracker.com","password":"Admin123!"}'
```

### Test Auth Check (requires cookies):
```bash
curl -X GET "https://score-tracker-177.preview.emergentagent.com/api/auth/me" \
  --cookie "access_token=<token>"
```
