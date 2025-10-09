# FarmConnect MVP Testing Guide

## Overview
This guide provides step-by-step instructions for testing all features of the FarmConnect platform, including wallet simulation, escrow, messaging, map functionality, and admin operations.

## Prerequisites

### Environment Setup
Ensure `.env` file contains:
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# DEV MODE flags
VITE_DEV_MODE_ALLOW_ADMIN_SIGNUP=true
```

### Test Accounts
Create these accounts for comprehensive testing:
1. **Admin User** (role: admin)
2. **Farmer User** (role: farmer)
3. **Provider User** (role: provider)

---

## 1. Authentication Flow Testing

### Signup Flow
1. Navigate to welcome screen
2. Click "Sign Up"
3. Test with different roles:
   - Farmer
   - Provider
   - Admin (DEV ONLY)
4. Use Ghana phone format: `0XXXXXXXXX` or `+233XXXXXXXXX`
5. Set password (min 6 characters)
6. Verify account creation success

**Expected Result:** User account created with selected role

### Login Flow
1. Enter registered phone number
2. Enter password
3. Click "Log In"
4. Verify redirect to correct dashboard based on role

**Expected Result:** User logged in and redirected to role-specific dashboard

---

## 2. Wallet Simulation Testing

### Setup Test Wallet
```
Endpoint: GET /functions/v1/wallet-balance/{user_id}
```

**Test Steps:**
1. Log in as farmer
2. Navigate to wallet section
3. Verify wallet shows:
   - Balance: GH₵0.00 (initial)
   - Total Earned: GH₵0.00
   - Total Spent: GH₵0.00

### Top-Up Wallet (Simulation)
1. Click "Top Up" button
2. Enter amount (e.g., 500)
3. Click "Confirm Top Up"
4. Note: This is simulated. In production, integrate with Paystack

**Expected Result:** Wallet balance increases

**Production Integration:**
Replace simulation with Paystack initialization:
```javascript
// In production, replace wallet top-up with:
const response = await fetch('https://api.paystack.co/transaction/initialize', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_PAYSTACK_SECRET_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: user.email,
    amount: amount * 100, // Convert to pesewas
    callback_url: 'your_callback_url',
  }),
});
```

---

## 3. Booking Flow Testing

### Create a Booking
```
Endpoint: POST /functions/v1/create-booking
```

**Test Data:**
```json
{
  "farmer_id": "farmer_uuid",
  "service_id": "service_uuid",
  "provider_id": "provider_uuid",
  "scheduled_date": "2025-10-15T10:00:00Z",
  "duration": 4,
  "total_price": 200,
  "service_location": "Accra, Greater Accra",
  "notes": "Please bring tractor"
}
```

**Test Steps:**
1. Log in as farmer
2. Browse services marketplace
3. Select a service
4. Click "Book Service"
5. Fill booking form
6. Submit booking

**Expected Result:** Booking created with status "pending"

### Update Booking Status
```
Endpoint: POST /functions/v1/booking-update-status
```

**Test Scenarios:**
1. **Provider accepts:**
   - Log in as provider
   - View pending bookings
   - Click "Accept"
   - Status changes to "accepted"

2. **Provider declines:**
   - Click "Decline"
   - Status changes to "declined"

3. **Start service:**
   - Status changes to "in-progress"

4. **Complete service:**
   - Status changes to "completed"

---

## 4. Escrow System Testing

### Deposit to Escrow
```
Endpoint: POST /functions/v1/escrow-deposit
```

**Test Data:**
```json
{
  "booking_id": "booking_uuid",
  "farmer_id": "farmer_uuid",
  "amount": 200
}
```

**Test Steps:**
1. Log in as farmer with wallet balance ≥ booking amount
2. Go to active booking
3. Click "Pay to Escrow"
4. Confirm payment

**Expected Results:**
- Farmer wallet balance decreases by booking amount
- Escrow record created with status "funded"
- Booking shows escrow is active

### Release Escrow (Happy Path)
```
Endpoint: POST /functions/v1/escrow-release
```

**Test Data:**
```json
{
  "escrow_id": "escrow_uuid",
  "farmer_id": "farmer_uuid"
}
```

**Test Steps:**
1. Booking must be completed
2. Farmer clicks "Release Payment"
3. Confirm release

**Expected Results:**
- Escrow status changes to "released"
- Provider wallet balance increases by escrow amount
- Review modal appears for farmer to rate provider

---

## 5. Dispute System Testing

### Raise a Dispute
```
Endpoint: POST /functions/v1/escrow-dispute
```

**Test Data:**
```json
{
  "escrow_id": "escrow_uuid",
  "user_id": "farmer_or_provider_uuid",
  "reason": "Service not completed",
  "details": "Provider did not finish plowing the field"
}
```

**Test Steps:**
1. Log in as farmer or provider
2. Navigate to active escrow
3. Click "Raise Dispute"
4. Fill dispute form
5. Submit

**Expected Results:**
- Dispute created with status "open"
- Escrow status changes to "disputed"
- Admin receives notification

### Resolve Dispute (Admin)
```
Endpoint: POST /functions/v1/dispute-resolve
```

**Test Data:**
```json
{
  "dispute_id": "dispute_uuid",
  "admin_id": "admin_uuid",
  "resolution": "Service was partially completed",
  "action": "split"
}
```

**Actions to Test:**
1. **Refund Farmer:**
   ```json
   { "action": "refund_farmer" }
   ```
   - Full amount returned to farmer wallet
   - Booking cancelled

2. **Release to Provider:**
   ```json
   { "action": "release_provider" }
   ```
   - Full amount goes to provider wallet
   - Booking marked completed

3. **Split Payment:**
   ```json
   { "action": "split" }
   ```
   - 50% to farmer, 50% to provider
   - Booking marked completed

**Test Steps:**
1. Log in as admin
2. Go to "Disputes" section
3. Select open dispute
4. Review details
5. Choose resolution action
6. Submit resolution

**Expected Results:**
- Dispute status = "resolved"
- Funds distributed according to action
- Both parties notified

---

## 6. Messaging System Testing

### Send Text Message
```
Endpoint: POST /functions/v1/messages-send
```

**Test Data:**
```json
{
  "booking_id": "booking_uuid",
  "sender_id": "user_uuid",
  "receiver_id": "other_user_uuid",
  "message_type": "text",
  "content": "Hello, when will you arrive?"
}
```

**Test Steps:**
1. Open booking chat
2. Type message
3. Press Enter or click Send
4. Check message appears in conversation

**Expected Results:**
- Message delivered instantly
- Receiver sees message in real-time (Realtime subscription)

### Send Audio Message
**Test Steps:**
1. Click microphone icon
2. Browser requests microphone permission (grant it)
3. Speak message
4. Click microphone icon again to stop
5. Click "Send Audio"

**Expected Results:**
- Audio file uploaded to Supabase Storage
- Audio message appears in chat
- Receiver can play audio

**Technical Details:**
- Audio recorded as WebM format
- Stored in `audio-messages` bucket
- Path: `{booking_id}/audio_{timestamp}.webm`

### Send Image Message
**Test Steps:**
1. Click image icon
2. Select image file
3. Image uploads automatically

**Expected Results:**
- Image uploaded to Supabase Storage
- Image displayed in chat
- Stored in `message-images` bucket

### Test Realtime Updates
1. Open chat on two devices/browsers
2. Log in as farmer on device 1
3. Log in as provider on device 2
4. Send message from device 1
5. Verify message appears on device 2 without refresh

**Expected Result:** Messages appear in real-time via Supabase Realtime subscriptions

---

## 7. Map & Location Testing

### Get Nearby Providers
```
Endpoint: GET /functions/v1/get-nearby-services
Query Params: lat, lng, radius, category
```

**Test Steps:**
1. Click "Map" in navigation
2. Allow location access (or default to Accra)
3. Map loads nearby providers

**Test Scenarios:**

#### Filter by Category
1. Click "Filter" button
2. Select category (Machinery, Mechanic, Extension, Labour)
3. Verify only providers with selected service appear

#### Adjust Radius
1. Open filters
2. Move radius slider (5-100 km)
3. Verify provider list updates

#### View Provider Details
1. Click on provider card
2. Verify details shown:
   - Name, profile picture
   - Rating and reviews
   - Distance from user
   - Services offered
   - Contact option

**Haversine Distance Formula:**
The backend uses Haversine to calculate distance between coordinates:
```javascript
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
```

---

## 8. Profile & Reviews Testing

### View User Profile
```
Endpoint: GET /functions/v1/get-user-profile/{user_id}
```

**Test Steps:**
1. Click on any provider
2. View profile page
3. Verify displayed:
   - Average rating
   - Total reviews
   - Services offered
   - Bio and location

### Submit Review
```
Endpoint: POST /functions/v1/create-review
```

**Test Data:**
```json
{
  "reviewer_id": "farmer_uuid",
  "reviewee_id": "provider_uuid",
  "booking_id": "booking_uuid",
  "service_id": "service_uuid",
  "rating": 5,
  "comment": "Excellent service!"
}
```

**Test Steps:**
1. Complete a booking
2. Release escrow payment
3. Review modal appears automatically
4. Rate provider (1-5 stars)
5. Write comment
6. Submit review

**Expected Results:**
- Review saved in database
- Provider's average rating updated
- Total reviews count incremented
- Review appears on provider profile

---

## 9. Admin Dashboard Testing

### View Dashboard Stats
```
Endpoint: GET /functions/v1/admin-dashboard-stats?admin_id={admin_uuid}
```

**Test Steps:**
1. Log in as admin
2. Navigate to Admin Dashboard
3. Verify live counters display:
   - Active Bookings
   - Completed Bookings
   - Total Revenue (sum of released escrow)
   - Open Disputes
   - Total Farmers
   - Total Providers

**Expected Results:**
- All stats update in real-time
- Recent bookings list shows last 10 bookings
- Data matches database counts

### Manage Disputes
1. Click on "Disputes" tab
2. View list of open disputes
3. Click on dispute to see details
4. Test resolution actions (see Dispute Testing section)

### View All Users
1. Navigate to "Users" section
2. Filter by role (farmer, provider, admin)
3. Search by name/phone
4. View user details

---

## 10. Realtime Subscription Testing

### Test Booking Updates
1. Open two browsers
2. Log in as farmer in browser 1
3. Log in as provider in browser 2
4. Provider accepts booking in browser 2
5. Verify farmer sees status update in browser 1 without refresh

### Test Message Updates
1. Open chat on two devices
2. Send message from one device
3. Verify appears instantly on other device

### Test Escrow Status Updates
1. Farmer deposits to escrow
2. Provider sees escrow funded instantly
3. Admin sees new transaction in dashboard

**Implementation:**
```javascript
// Realtime subscription example
const channel = supabase
  .channel('bookings')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'bookings',
  }, (payload) => {
    // Update UI
  })
  .subscribe();
```

---

## 11. Audio Recording Testing

### Browser Compatibility
Test audio recording on:
- Chrome/Edge (WebM support)
- Firefox (WebM support)
- Safari (may need MP4/AAC)

### Microphone Permission
1. First time: Browser requests permission
2. Grant permission
3. Red recording indicator should appear
4. Speak clearly into microphone
5. Stop recording
6. Audio preview should be available

### Troubleshooting
- **No permission:** Check browser settings
- **Poor quality:** Adjust mic settings
- **Not recording:** Verify mic hardware

---

## 12. Production Deployment Checklist

### Before Going Live

#### 1. Disable Dev Mode
Edit `src/components/auth/SignupForm.tsx`:
```typescript
const DEV_MODE_ALLOW_ADMIN_SIGNUP = false; // Set to false
```

Edit `supabase/functions/auth-signup/index.ts`:
```typescript
const DEV_MODE_ALLOW_ADMIN_SIGNUP = false; // Set to false
```

#### 2. Configure Paystack
Edit `.env`:
```bash
PAYSTACK_SECRET_KEY=sk_live_your_live_key
PAYSTACK_PUBLIC_KEY=pk_live_your_live_key
```

Edit `supabase/functions/escrow-deposit/index.ts`:
```typescript
const USE_WALLET_SIMULATION = false; // Set to false
```

#### 3. Setup Storage Buckets
Create in Supabase Dashboard:
```
- audio-messages (public)
- message-images (public)
- profile-pictures (public)
```

#### 4. Configure RLS Policies
Verify all tables have proper RLS policies enabled (already done in migrations)

#### 5. Test Payment Flow
1. Create test booking
2. Use Paystack test cards
3. Verify webhook handling
4. Check escrow funding

---

## 13. Common Issues & Solutions

### Issue: "Insufficient wallet balance"
**Solution:** Top up wallet before depositing to escrow

### Issue: "Invalid booking"
**Solution:** Ensure booking exists and user is part of the booking

### Issue: "Microphone not working"
**Solution:**
- Check browser permissions
- Use HTTPS (required for mic access)
- Try different browser

### Issue: "Location not loading"
**Solution:**
- Grant location permission
- Check browser location settings
- Fallback to default (Accra) if denied

### Issue: "Realtime not working"
**Solution:**
- Check Supabase project status
- Verify Realtime enabled in dashboard
- Check browser console for errors

### Issue: "Images not uploading"
**Solution:**
- Verify storage buckets created
- Check file size limits
- Ensure proper CORS settings

---

## 14. API Endpoint Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/wallet-balance/{user_id}` | GET | Get wallet balance |
| `/escrow-deposit` | POST | Deposit funds to escrow |
| `/escrow-release` | POST | Release escrow to provider |
| `/escrow-dispute` | POST | Raise dispute |
| `/dispute-resolve` | POST | Resolve dispute (admin) |
| `/messages-send` | POST | Send message |
| `/messages-list` | GET | Get conversation messages |
| `/booking-update-status` | POST | Update booking status |
| `/create-booking` | POST | Create new booking |
| `/get-nearby-services` | GET | Get providers by location |
| `/admin-dashboard-stats` | GET | Get admin dashboard data |
| `/get-user-profile/{id}` | GET | Get user profile |
| `/create-review` | POST | Submit review |

---

## 15. Test Data Templates

### Sample Booking
```json
{
  "farmer_id": "uuid-farmer",
  "service_id": "uuid-service",
  "provider_id": "uuid-provider",
  "scheduled_date": "2025-10-15T10:00:00Z",
  "duration": 4,
  "total_price": 200,
  "service_location": "Tema, Greater Accra",
  "notes": "Need tractor for 2 acres"
}
```

### Sample Review
```json
{
  "reviewer_id": "uuid-farmer",
  "reviewee_id": "uuid-provider",
  "booking_id": "uuid-booking",
  "rating": 5,
  "comment": "Very professional and timely!"
}
```

### Sample Provider Location
```json
{
  "name": "John's Tractor Service",
  "latitude": 5.6037,
  "longitude": -0.1870,
  "services_offered": ["machinery", "labour"],
  "address": "Accra, Greater Accra"
}
```

---

## Support

For issues or questions:
1. Check browser console for errors
2. Verify environment variables set correctly
3. Check Supabase logs in dashboard
4. Review edge function logs
5. Test with different user roles

## Next Steps

After testing:
1. Document any bugs found
2. Create production environment
3. Set up monitoring and alerts
4. Configure backup strategy
5. Plan user training sessions
