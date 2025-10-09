# Admin Signup Configuration

## Overview
This document explains the temporary admin signup feature and how to disable it after initial setup.

## Current State (Development Mode)

### What's Enabled
- Direct admin registration through the signup form
- Admin role option visible in the signup dropdown
- No invite token required for admin signup

### Security Notice
⚠️ **This configuration is for DEVELOPMENT ONLY**. It allows anyone to create an admin account without invitation. This should be disabled in production after the initial admin account is created.

## How It Works

### Backend (Edge Function)
File: `supabase/functions/auth-signup/index.ts`

```typescript
// Line 11
const DEV_MODE_ALLOW_ADMIN_SIGNUP = true;
```

When `DEV_MODE_ALLOW_ADMIN_SIGNUP = true`:
- Admin role is accepted without invite token
- Invite token is validated if provided
- User can register directly as admin

### Frontend (React)
File: `src/components/auth/SignupForm.tsx`

```typescript
// Line 17
const DEV_MODE_ALLOW_ADMIN_SIGNUP = true;
```

When `DEV_MODE_ALLOW_ADMIN_SIGNUP = true`:
- Admin option appears in signup dropdown
- Warning message shown: "Admin option is only available in development mode"

## Disabling Admin Signup (Production Mode)

After creating your initial admin account, follow these steps to secure the platform:

### Step 1: Update Backend
Edit `supabase/functions/auth-signup/index.ts`:

```typescript
// Change line 11 from:
const DEV_MODE_ALLOW_ADMIN_SIGNUP = true;

// To:
const DEV_MODE_ALLOW_ADMIN_SIGNUP = false;
```

Then redeploy the edge function using the Supabase deployment tool.

### Step 2: Update Frontend
Edit `src/components/auth/SignupForm.tsx`:

```typescript
// Change line 17 from:
const DEV_MODE_ALLOW_ADMIN_SIGNUP = true;

// To:
const DEV_MODE_ALLOW_ADMIN_SIGNUP = false;
```

### Step 3: Rebuild Application
```bash
npm run build
```

### Step 4: Verify Changes
1. Try to sign up - Admin option should NOT appear in dropdown
2. Attempt to register as admin via API - Should fail without valid invite token
3. Test admin invite system - Should work normally

## Production Admin Creation

After disabling DEV_MODE, new admins can only be created through:

### Method 1: Admin Invite System
1. Existing admin logs in
2. Navigate to Admin Dashboard
3. Use "Admin Invite Generator" to create invite link
4. Share invite link with new admin
5. New admin signs up using the invite link

### Method 2: Direct Database Insert (Last Resort)
If you lose admin access, you can create an admin directly in the database:

```sql
-- Update an existing user to admin
UPDATE users
SET role = 'admin'
WHERE phone = '+233XXXXXXXXX';

-- Or create a new admin user (requires hashed password)
INSERT INTO users (name, phone, role, password_hash, is_verified)
VALUES ('Admin Name', '+233XXXXXXXXX', 'admin', 'hashed_password', true);
```

## Security Best Practices

### DO ✅
- Disable DEV_MODE immediately after initial setup
- Use admin invite system for new admins
- Keep invite links private and time-limited
- Regularly audit admin accounts
- Use strong passwords for admin accounts

### DON'T ❌
- Leave DEV_MODE enabled in production
- Share admin credentials
- Create multiple admin accounts unnecessarily
- Use the same password across accounts
- Deploy with DEV_MODE=true to production servers

## Configuration Summary

| Location | File | Variable | Development | Production |
|----------|------|----------|-------------|------------|
| Backend | `supabase/functions/auth-signup/index.ts` | `DEV_MODE_ALLOW_ADMIN_SIGNUP` | `true` | `false` |
| Frontend | `src/components/auth/SignupForm.tsx` | `DEV_MODE_ALLOW_ADMIN_SIGNUP` | `true` | `false` |

## Verification Checklist

Before deploying to production, verify:

- [ ] Backend DEV_MODE flag is set to `false` in `supabase/functions/auth-signup/index.ts`
- [ ] Frontend DEV_MODE flag is set to `false` in `src/components/auth/SignupForm.tsx`
- [ ] Edge function redeployed after backend changes
- [ ] Application rebuilt after frontend changes
- [ ] Admin option not visible in signup form
- [ ] API rejects admin signup without invite token
- [ ] Admin invite system works correctly
- [ ] At least one admin account exists and is accessible

## Troubleshooting

### Problem: Can't create first admin after disabling DEV_MODE
**Solution**: Temporarily re-enable DEV_MODE, create admin, then disable again

### Problem: Admin option still visible after setting to false
**Solution**: Clear browser cache and rebuild application

### Problem: API still accepts admin signup without token
**Solution**: Verify edge function redeployed with updated code

### Problem: Lost admin access
**Solution**: Use direct database update method (see Method 2 above)

## Support

If you encounter issues:
1. Check environment variables are set correctly
2. Verify edge functions deployed successfully
3. Clear browser cache and rebuild
4. Review backend logs for error messages
5. Test with valid admin invite token

## Change History

- **2025-10-03**: Initial implementation with DEV_MODE support
- Created temporary admin signup feature
- Added frontend/backend flags for easy toggling
- Documented security procedures
