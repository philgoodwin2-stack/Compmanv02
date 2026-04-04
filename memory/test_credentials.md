# Test Credentials

## Admin Users (Preview Environment)
- Username: `phil g` - is_admin: true
- Username: `Phil g` - is_admin: true  
- Username: `Phil G` - is_admin: true
- Username: `Phil` - is_admin: true

## First-Time Setup (Production/New Deployment)
When deploying to production with an empty database:
1. Log in with any username (creates new player)
2. Go to Players page
3. Admin controls will be visible (because no admins exist)
4. Tap "Admin" button on yourself to become first admin
5. After that, only admins can grant admin access

## Notes
- Login is case-sensitive: "Phil G" and "phil g" are different users
- Clear browser cache/localStorage if admin status seems stuck
