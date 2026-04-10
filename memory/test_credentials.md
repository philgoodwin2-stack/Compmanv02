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

## Testing Society Management
To test the Society Management features:
1. Login as `TestAdmin` - this user has admin rights for "Test Golf Society"
2. Navigate to `/society` page
3. Admin can:
   - Edit society name (click Settings gear icon)
   - Regenerate join code (click Refresh icon next to code)
   - Transfer admin to another member (Shield icon on member)
   - Remove members (Trash icon on member)

## First-Time Setup (Production/New Deployment)
When deploying to production with an empty database:
1. Log in with any username (creates new player)
2. Create a new society (you become admin automatically)
3. Share join code with other players
4. Admin controls available in Society page

## Important Notes
- Login is case-sensitive: "Phil G" and "phil g" are different users
- Multiple users may share the same username but belong to different societies
- Clear browser localStorage if session seems stuck
