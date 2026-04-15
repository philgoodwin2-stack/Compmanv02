# Test Credentials

## Global Admin Users
| Username | Society | is_global_admin | Notes |
|----------|---------|-----------------|-------|
| TestAdmin | Test Golf Society | **true** | Has rights across ALL societies |

## Society Admin Users (Preview Environment)
| Username | Society | Join Code | is_admin | Notes |
|----------|---------|-----------|----------|-------|
| TestAdmin | Test Golf Society | TW83XM | true | Also Global Admin |
| phil g | vt vert | 9ACURL | true | Society admin only |
| phil g | WhatsApp | FJSUWB | true | Society admin only |

## Regular Users
| Username | Society | is_admin |
|----------|---------|----------|
| Gem G | WhatsApp | false |
| Tim G | WhatsApp | false |

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

## Testing Admin Features

### As TestAdmin (Global Admin):
1. Login as "TestAdmin"
2. Can see purple "Global Admin" badge
3. On Players page, see both "Admin" and "Global" toggle buttons
4. Can manage invite links for ANY society
5. Can remove members from ANY society
6. Can delete ANY society

### As Regular Society Admin:
1. Login as "phil g" (in WhatsApp society)
2. Can see gold "Admin" badge
3. On Players page, see only "Admin" toggle button
4. Can only manage their own society
