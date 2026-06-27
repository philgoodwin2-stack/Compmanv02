# Test Credentials

## Authenticated User Accounts (Email/Password Auth)

| Email | Password | Role | Linked Player | Subscription Status | Notes |
|-------|----------|------|---------------|---------------------|-------|
| admin@scoretracker.com | TestPass123! | admin | TestAdmin | Active (28 days) | Main test account |
| nosub@test.com | TestPass123! | user | None | Expired Trial | For testing subscription block |

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

## How Authentication Works

### Auth Flow
1. **Register** - Create account at `/api/auth/register`
2. **Login** - Sign in at `/api/auth/login` 
3. **Link Player** - Link to existing player at `/api/auth/link-player`
4. **Forgot Password** - Request reset link at `/api/auth/forgot-password`
5. **Reset Password** - Set new password at `/api/auth/reset-password`

### Token Storage
- Access token stored in localStorage as `authToken`
- Sent via `Authorization: Bearer <token>` header

### API Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/logout` - Clear session
- `GET /api/auth/me` - Get current authenticated user
- `GET /api/auth/available-players` - Get players for linking
- `POST /api/auth/link-player` - Link player to account
- `POST /api/auth/forgot-password` - Request password reset email
- `POST /api/auth/reset-password` - Reset password with token

## Password Reset Setup

To enable email delivery for password reset:

1. **Get Resend API Key:**
   - Sign up at https://resend.com
   - Go to Dashboard → API Keys → Create API Key
   - Key starts with `re_...`

2. **Add to backend/.env:**
   ```
   RESEND_API_KEY=re_your_api_key_here
   SENDER_EMAIL=onboarding@resend.dev
   ```

3. **Restart backend:**
   ```bash
   sudo supervisorctl restart backend
   ```

**Note:** Without RESEND_API_KEY configured, reset links are logged to the console instead of emailed.

## Testing Auth Features

### Test Forgot Password:
```bash
curl -X POST "https://score-tracker-177.preview.emergentagent.com/api/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com"}'
```

### Test Reset Password:
```bash
curl -X POST "https://score-tracker-177.preview.emergentagent.com/api/auth/reset-password" \
  -H "Content-Type: application/json" \
  -d '{"token":"<token_from_email>","new_password":"NewPassword123!"}'
```
