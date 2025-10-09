# Navigation Implementation Guide

## Overview
Full navigation system implemented with back buttons, bottom navigation, and logical flow management.

## Navigation Components

### 1. **PageHeader** (`src/components/PageHeader.tsx`)
- Displays page title and subtitle
- Provides back button when `onBack` prop is provided
- Supports custom action buttons
- Used across all secondary screens

### 2. **BottomNav** (`src/components/BottomNav.tsx`)
- Fixed bottom navigation bar
- Four main sections: Dashboard, Map, Requests, Profile
- Highlights current active view
- Always accessible from any screen

### 3. **Navigation** (`src/components/Navigation.tsx`)
- Top navigation bar
- Shows user info and role badge
- Quick access to Dashboard, Profile, and Service Map
- Logout functionality

### 4. **MainApp** (`src/components/MainApp.tsx`)
- Central navigation controller
- Manages view state and navigation history
- Handles back navigation with history stack
- Renders appropriate content based on current view

## Navigation Flows

### Farmer Navigation Flow

```
Dashboard (Home)
├── Service Map ← Back
│   └── Provider Profile ← Back to Map
├── Marketplace ← Back
│   └── Service Details ← Back to Marketplace
├── My Profile ← Back
│   └── Edit Profile ← Back to Profile
└── My Requests ← Back
    └── Request Details ← Back to Requests
```

### Provider Navigation Flow

```
Dashboard (Home)
├── My Profile ← Back
│   └── Edit Profile ← Back to Profile
├── My Services ← Back
│   └── Add/Edit Service ← Back to Services
└── My Reviews ← Back
```

### Admin Navigation Flow

```
Dashboard (Home)
├── User Management ← Back
├── Invite Generator ← Back
└── System Settings ← Back
```

## Navigation Methods

### 1. Back Button (PageHeader)
- Visible on all secondary screens
- Returns to previous view in history
- Maintains navigation stack

### 2. Bottom Navigation
- Quick access to main sections
- Available from any screen
- Highlights current section

### 3. Top Navigation
- Access to Dashboard, Profile, Map
- User info and logout
- Always visible when authenticated

### 4. Programmatic Navigation
- `navigateTo(view, providerId?)` - Navigate forward
- `navigateBack()` - Navigate to previous view
- History stack maintained automatically

## Key Features

### 1. Navigation History
- Maintains stack of previous views
- Back button intelligently returns to correct screen
- Prevents getting stuck in navigation loops

### 2. Context Preservation
- Selected provider ID preserved when viewing profiles
- Form data maintained during navigation
- User state persists across views

### 3. Mobile-Optimized
- Bottom navigation for easy thumb access
- Large touch targets
- Responsive design for all screen sizes

### 4. Consistent UX
- Back button always in top-left
- Consistent navigation patterns
- Predictable behavior across all screens

## Usage Examples

### Navigate from Dashboard to Map
```typescript
<button onClick={() => onNavigate?.('map')}>
  Service Map
</button>
```

### Navigate with Provider ID
```typescript
<ServiceMap onProviderSelect={(provider) =>
  navigateTo('provider-profile', provider.id)
} />
```

### Add Back Navigation
```tsx
<PageHeader
  title="Service Map"
  subtitle="Find nearby providers"
  onBack={navigateBack}
/>
```

## Views Available

- `dashboard` - Main dashboard (role-specific)
- `profile` - User's own profile
- `map` - Service map with providers
- `marketplace` - Browse all services
- `provider-profile` - View specific provider
- `requests` - View service requests
- `reviews` - View reviews received

## Navigation Props

### Dashboard Components
```typescript
interface DashboardProps {
  onNavigate?: (view: string) => void;
}
```

### ServiceMap Component
```typescript
interface ServiceMapProps {
  onProviderSelect?: (provider: any) => void;
}
```

### UserProfile Component
```typescript
interface UserProfileProps {
  userId?: string;
  isOwnProfile?: boolean;
}
```

## Best Practices

1. **Always provide onBack** for secondary screens
2. **Use onNavigate prop** instead of managing state locally
3. **Maintain navigation context** when switching views
4. **Test navigation loops** to ensure users can always return
5. **Provide visual feedback** for current location
6. **Keep navigation simple** - max 3 levels deep

## Testing Navigation

### Test Cases
1. ✅ Dashboard → Map → Provider Profile → Back → Back → Dashboard
2. ✅ Dashboard → Profile → Edit → Cancel → Profile → Back → Dashboard
3. ✅ Dashboard → Marketplace → Service → Book → Dashboard
4. ✅ Bottom Nav works from any screen
5. ✅ Top Nav quick links work from any screen
6. ✅ Back button disabled/hidden on root views
7. ✅ Navigation history correctly maintained
8. ✅ Provider context preserved when viewing profiles

## Future Enhancements

- [ ] Add breadcrumb navigation for deep views
- [ ] Implement swipe gestures for back navigation
- [ ] Add transition animations between views
- [ ] Support deep linking with URL parameters
- [ ] Add navigation analytics tracking
