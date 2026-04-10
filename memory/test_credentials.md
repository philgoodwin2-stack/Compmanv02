# Test Credentials

## Society Admin Users (Preview Environment)
| Username | Society | Join Code | is_admin | Notes |
|----------|---------|-----------|----------|-------|
| TestAdmin | Test Golf Society | NPFUJH | true | Primary test admin account |
| phil g | vt vert | 9ACURL | true | Society admin |
| phil g | WhatsApp | FJSUWB | true | Society admin |
| phil g | WhatsApp | VTVERT | true | Society admin |

## Non-Admin Test Users
| Username | Society | is_admin |
|----------|---------|----------|
| Gem G | WhatsApp (VTVERT) | false |
| Tim G | WhatsApp (VTVERT) | false |

## Users Without Society
| Username | Notes |
|----------|-------|
| phil g | First phil g (no society) |
| Nathan D | No society assigned |

## Test Invite Links
| Invite Code | Society | Expires | Notes |
|-------------|---------|---------|-------|
| 2exdvkqp | Test Golf Society | 2026-04-17 | 7-day default expiration |

## Testing Society Management
To test the Society Management features:
1. Login as `TestAdmin` - this user has admin rights for "Test Golf Society"
2. Navigate to `/society` page
3. Admin can:
   - Edit society name (click Settings gear icon)
   - Regenerate join code (click Refresh icon next to code)
   - Transfer admin to another member (Shield icon on member)
   - Remove members (Trash icon on member)

## Testing Invite Links
To test the Invite Link feature:
1. Login as `TestAdmin`
2. Navigate to `/society` page
3. Click "Create Link" button in Invite Links section
4. Choose expiration (1, 3, 7, 14, or 30 days)
5. Click "Create & Copy Link" - link is copied to clipboard
6. Share the link (format: `{domain}/join/{code}`)
7. New user opens link, enters name, clicks "Join Society"
8. User is redirected to dashboard

## Test URLs
- Join page: `https://score-tracker-177.preview.emergentagent.com/join/2exdvkqp`
- Society page: `https://score-tracker-177.preview.emergentagent.com/society`

## First-Time Setup (Production/New Deployment)
When deploying to production with an empty database:
1. Log in with any username (creates new player)
2. Create a new society (you become admin automatically)
3. Share join code or create invite links with other players
4. Admin controls available in Society page

## Important Notes
- Login is case-sensitive: "Phil G" and "phil g" are different users
- Multiple users may share the same username but belong to different societies
- Clear browser localStorage if session seems stuck
- Invite links expire based on admin selection (default 7 days)
- Invite links have unlimited uses until revoked or expired
